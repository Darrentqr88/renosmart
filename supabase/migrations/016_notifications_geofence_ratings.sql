-- Migration 016: Notifications + Geofence coords + Worker ratings
-- Supports: worker auto check-in, cross-role notifications, auto-rating

-- ═══════════════════════════════════════════════════════════
-- 1. Notifications table
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type       TEXT NOT NULL, -- worker_checkin, worker_checkout, photo_uploaded, task_completed, worker_added, duration_changed
  title      TEXT NOT NULL,
  body       TEXT,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own notifications
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for cross-user notifications)
CREATE POLICY "notifications_service_insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- ═══════════════════════════════════════════════════════════
-- 2. Project geofence coordinates
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_lat NUMERIC(10,7);
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_lng NUMERIC(10,7);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 3. Worker rating fields on profiles
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_rating NUMERIC(3,2) DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_breakdown JSONB DEFAULT '{}';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_bio TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_regions TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 4. Gantt tasks: quotation_items for worker view (no prices)
-- ═══════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE gantt_tasks ADD COLUMN IF NOT EXISTS quotation_items JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
