-- Migration 003: Create project_quotations with correct schema
-- Run this in Supabase SQL Editor

-- Drop old table if it has wrong schema (designer_id instead of user_id)
-- Only drops if it exists AND has designer_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_quotations'
    AND column_name = 'designer_id'
    AND table_schema = 'public'
  ) THEN
    DROP TABLE IF EXISTS project_quotations CASCADE;
  END IF;
END $$;

-- Create project_quotations with correct schema
CREATE TABLE IF NOT EXISTS project_quotations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  version         INTEGER DEFAULT 1,
  file_name       TEXT,
  file_url        TEXT,
  is_active       BOOLEAN DEFAULT false,
  total_amount    NUMERIC(12,2) DEFAULT 0,
  parsed_items    JSONB,
  analysis_result JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_quotations_own" ON project_quotations;
CREATE POLICY "project_quotations_own" ON project_quotations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_quotations_project ON project_quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_quotations_user    ON project_quotations(user_id);

-- ─── cost_records: add missing columns used by the app ───────────────────────
ALTER TABLE cost_records
  ADD COLUMN IF NOT EXISTS total_amount   NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trade          TEXT,
  ADD COLUMN IF NOT EXISTS work_item      TEXT,
  ADD COLUMN IF NOT EXISTS items          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- ─── variation_orders: create if missing ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS variation_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  vo_number     TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  approved_at   TIMESTAMPTZ
);

ALTER TABLE variation_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variation_orders_own" ON variation_orders;
CREATE POLICY "variation_orders_own" ON variation_orders
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_variation_orders_project ON variation_orders(project_id);
