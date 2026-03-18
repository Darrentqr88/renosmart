-- Migration 002: Add missing tables for RenoSmart
-- Run this in Supabase SQL editor

-- =============================================
-- variation_orders
-- =============================================
CREATE TABLE IF NOT EXISTS variation_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vo_number     TEXT NOT NULL,
  description   TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  approved_at   TIMESTAMPTZ
);

ALTER TABLE variation_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variation_orders_designer" ON variation_orders
  FOR ALL USING (
    auth.uid() = (SELECT designer_id FROM projects WHERE id = project_id)
  );

-- =============================================
-- project_events (calendar events)
-- =============================================
CREATE TABLE IF NOT EXISTS project_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  designer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  event_date    DATE NOT NULL,
  remind_at     TIMESTAMPTZ,
  color         TEXT DEFAULT '#2E6BE6',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_events_own" ON project_events
  FOR ALL USING (auth.uid() = designer_id);

-- =============================================
-- Add designer_workers.profile_id if missing
-- =============================================
ALTER TABLE designer_workers ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================
-- Add project_quotations table if not exists
-- =============================================
CREATE TABLE IF NOT EXISTS project_quotations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  designer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name     TEXT,
  file_url      TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  total_amount  NUMERIC(12, 2) DEFAULT 0,
  analysis_result JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_quotations_own" ON project_quotations
  FOR ALL USING (auth.uid() = designer_id);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_variation_orders_project ON variation_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_designer ON project_events(designer_id);
CREATE INDEX IF NOT EXISTS idx_project_events_date ON project_events(event_date);
CREATE INDEX IF NOT EXISTS idx_project_quotations_project ON project_quotations(project_id);
