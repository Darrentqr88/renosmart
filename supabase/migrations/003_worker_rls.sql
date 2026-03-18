-- Migration 003: Worker RLS policies, project_events table, contractor profile columns
-- Run in Supabase SQL Editor

-- =====================
-- 1. GANTT TASKS: Allow workers to read assigned tasks
-- =====================
-- Drop existing combined policy to replace with a broader one
DROP POLICY IF EXISTS "gantt_own" ON gantt_tasks;

-- New combined policy: owner OR assigned worker can read
CREATE POLICY "gantt_read" ON gantt_tasks
  FOR SELECT USING (
    auth.uid() = user_id
    OR assigned_workers @> to_jsonb(auth.uid())
  );

-- Owner (designer) can still do full CRUD
CREATE POLICY "gantt_write" ON gantt_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gantt_update_owner" ON gantt_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "gantt_delete" ON gantt_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Workers can update progress/subtasks on their assigned tasks
CREATE POLICY "gantt_worker_update" ON gantt_tasks
  FOR UPDATE USING (assigned_workers @> to_jsonb(auth.uid()))
  WITH CHECK (assigned_workers @> to_jsonb(auth.uid()));

-- =====================
-- 2. PROJECT_EVENTS TABLE (GPS check-in notifications)
-- =====================
CREATE TABLE IF NOT EXISTS project_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  event_type  TEXT,  -- 'worker_checkin', 'worker_checkout', 'milestone', etc.
  title       TEXT,
  event_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

-- Worker can insert their own events
CREATE POLICY "project_events_insert" ON project_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Worker sees their own events; designer sees all events for their projects
CREATE POLICY "project_events_select" ON project_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_events.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- =====================
-- 3. PROFILES: Add contractor company columns
-- =====================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ssm_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS min_project_value NUMERIC(12,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_project_value NUMERIC(12,2);

-- =====================
-- 4. SITE_PHOTOS: Allow workers to insert photos
-- =====================
-- Ensure uploaded_by check for worker inserts
DROP POLICY IF EXISTS "site_photos_own" ON site_photos;
CREATE POLICY "site_photos_own" ON site_photos
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.uid() = uploaded_by
  )
  WITH CHECK (
    auth.uid() = uploaded_by
  );

-- =====================
-- 5. COST_RECORDS: Allow workers to insert receipts
-- =====================
DROP POLICY IF EXISTS "cost_records_own" ON cost_records;
CREATE POLICY "cost_records_own" ON cost_records
  FOR ALL USING (
    auth.uid() = user_id
    OR auth.uid() = uploaded_by
  )
  WITH CHECK (
    auth.uid() = uploaded_by OR auth.uid() = user_id
  );
