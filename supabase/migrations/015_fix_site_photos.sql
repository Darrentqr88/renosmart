-- ================================================
-- Fix site_photos: ensure all columns exist + RLS allows designer to see worker photos
-- ================================================

-- 1. Add missing columns if they don't exist
DO $$ BEGIN
  -- Some DBs have 'uploader_id' instead of 'uploaded_by' or vice versa
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_photos' AND column_name='uploader_id') THEN
    ALTER TABLE site_photos ADD COLUMN uploader_id UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_photos' AND column_name='uploaded_by') THEN
    ALTER TABLE site_photos ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_photos' AND column_name='file_url') THEN
    ALTER TABLE site_photos ADD COLUMN file_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_photos' AND column_name='url') THEN
    ALTER TABLE site_photos ADD COLUMN url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_photos' AND column_name='status') THEN
    ALTER TABLE site_photos ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- 2. Sync values between duplicate columns
UPDATE site_photos SET uploader_id = uploaded_by WHERE uploader_id IS NULL AND uploaded_by IS NOT NULL;
UPDATE site_photos SET uploaded_by = uploader_id WHERE uploaded_by IS NULL AND uploader_id IS NOT NULL;
UPDATE site_photos SET file_url = url WHERE file_url IS NULL AND url IS NOT NULL;
UPDATE site_photos SET url = file_url WHERE url IS NULL AND file_url IS NOT NULL;

-- 3. Drop ALL existing site_photos policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'site_photos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_photos', r.policyname);
  END LOOP;
END $$;

-- 4. Enable RLS
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;

-- 5. Create proper RLS policies

-- Workers can INSERT their own photos
CREATE POLICY "site_photos_insert" ON site_photos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = uploader_id
    OR auth.uid() = uploaded_by
  );

-- Anyone who uploaded can see their photos
-- Designers can see photos for their projects
-- Owners can see approved photos for their projects
CREATE POLICY "site_photos_select" ON site_photos
  FOR SELECT USING (
    -- Uploader sees own photos
    auth.uid() = user_id
    OR auth.uid() = uploader_id
    OR auth.uid() = uploaded_by
    -- Designer sees all photos in their projects
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_photos.project_id
        AND projects.user_id = auth.uid()
    )
    -- Designer also might be in designer_id column
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_photos.project_id
        AND projects.designer_id = auth.uid()
    )
    -- Workers assigned to the project can see photos
    OR EXISTS (
      SELECT 1 FROM gantt_tasks
      WHERE gantt_tasks.project_id = site_photos.project_id
        AND gantt_tasks.assigned_workers::jsonb @> to_jsonb(array[auth.uid()::text])
    )
  );

-- Designer can update (approve/reject) photos in their projects
CREATE POLICY "site_photos_update" ON site_photos
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() = uploader_id
    OR auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_photos.project_id
        AND (projects.user_id = auth.uid() OR projects.designer_id = auth.uid())
    )
  );

-- Designer can delete (reject) photos in their projects
CREATE POLICY "site_photos_delete" ON site_photos
  FOR DELETE USING (
    auth.uid() = user_id
    OR auth.uid() = uploader_id
    OR auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_photos.project_id
        AND (projects.user_id = auth.uid() OR projects.designer_id = auth.uid())
    )
  );

-- 6. Create storage bucket if not exists + policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-photos', 'site-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies and recreate
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname LIKE '%site%photo%' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "site_photos_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-photos' AND auth.role() = 'authenticated');

CREATE POLICY "site_photos_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-photos');

CREATE POLICY "site_photos_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Also ensure project_events table exists (for check-in/check-out)
CREATE TABLE IF NOT EXISTS project_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  event_type  TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

-- Drop existing project_events policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'project_events' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON project_events', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "project_events_insert" ON project_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_events_select" ON project_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_events.project_id
        AND (projects.user_id = auth.uid() OR projects.designer_id = auth.uid())
    )
  );

-- 8. Ensure worker can read projects they're assigned to
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'worker_read_assigned_projects') THEN
    CREATE POLICY "worker_read_assigned_projects" ON projects
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM gantt_tasks
          WHERE gantt_tasks.project_id = projects.id
            AND gantt_tasks.assigned_workers::jsonb @> to_jsonb(array[auth.uid()::text])
        )
      );
  END IF;
END $$;
