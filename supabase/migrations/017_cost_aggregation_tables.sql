-- =====================================================================
-- 017: Cost Intelligence — aggregated cost database (mirrors price_database)
-- =====================================================================
-- cost_data_points: raw individual item-level cost data from receipts
-- cost_database:    aggregated min/avg/max per (category, subcategory, material_method, unit, region)

-- 1. Raw cost data points (one row per receipt line item)
CREATE TABLE IF NOT EXISTS cost_data_points (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category         TEXT NOT NULL,
  subcategory      TEXT NOT NULL DEFAULT 'General',
  material_method  TEXT NOT NULL DEFAULT 'Standard',
  item_name        TEXT,
  product_note     TEXT,
  unit             TEXT DEFAULT 'unit',
  unit_cost        NUMERIC(10,2),
  region           TEXT DEFAULT 'MY_KL',
  source           TEXT DEFAULT 'receipt',  -- 'receipt' | 'manual'
  project_id       UUID REFERENCES projects(id),
  receipt_id       UUID REFERENCES cost_records(id),
  confidence       NUMERIC(3,2) DEFAULT 0.8,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aggregated cost benchmarks (one row per unique combination)
CREATE TABLE IF NOT EXISTS cost_database (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category         TEXT NOT NULL,
  subcategory      TEXT NOT NULL DEFAULT 'General',
  material_method  TEXT NOT NULL DEFAULT 'Standard',
  item_name        TEXT,
  unit             TEXT DEFAULT 'unit',
  region           TEXT DEFAULT 'MY_KL',
  min_cost         NUMERIC(10,2),
  avg_cost         NUMERIC(10,2),
  max_cost         NUMERIC(10,2),
  sample_count     INTEGER DEFAULT 0,
  confidence       TEXT DEFAULT 'low' CHECK (confidence IN ('low', 'mid', 'high')),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, subcategory, material_method, unit, region)
);

-- 3. RLS policies
ALTER TABLE cost_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_database ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregated cost data (like price_database)
DROP POLICY IF EXISTS "cost_database_read" ON cost_database;
CREATE POLICY "cost_database_read" ON cost_database FOR SELECT USING (true);

-- Anyone authenticated can read raw data points
DROP POLICY IF EXISTS "cost_data_points_read" ON cost_data_points;
CREATE POLICY "cost_data_points_read" ON cost_data_points FOR SELECT USING (true);

-- Anyone authenticated can insert data points
DROP POLICY IF EXISTS "cost_data_points_insert" ON cost_data_points;
CREATE POLICY "cost_data_points_insert" ON cost_data_points FOR INSERT WITH CHECK (true);

-- Service role / anyone can upsert aggregated data
DROP POLICY IF EXISTS "cost_database_upsert" ON cost_database;
CREATE POLICY "cost_database_upsert" ON cost_database FOR ALL USING (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_cost_dp_category ON cost_data_points(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_cost_dp_region ON cost_data_points(region);
CREATE INDEX IF NOT EXISTS idx_cost_db_category ON cost_database(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_cost_db_region ON cost_database(region);
