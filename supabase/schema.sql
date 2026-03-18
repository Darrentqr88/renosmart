-- RenoSmart Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  role          TEXT CHECK (role IN ('designer', 'owner', 'worker')),
  name          TEXT,
  phone         TEXT,
  company       TEXT,
  company_address TEXT,
  trades        TEXT[],
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  region        TEXT DEFAULT 'MY',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- PROJECTS
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  designer_id     UUID REFERENCES auth.users(id),
  name            TEXT NOT NULL,
  address         TEXT,
  client_name     TEXT,
  client_phone    TEXT,
  client_email    TEXT,
  contract_amount NUMERIC(12,2) DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  progress        INTEGER DEFAULT 0,
  project_type    TEXT DEFAULT 'residential',
  sqft            INTEGER,
  start_date      DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROJECT QUOTATIONS (multi-version)
-- =====================
CREATE TABLE IF NOT EXISTS project_quotations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  version       INTEGER DEFAULT 1,
  file_name     TEXT,
  file_url      TEXT,
  is_active     BOOLEAN DEFAULT false,
  total_amount  NUMERIC(12,2),
  parsed_items  JSONB,
  analysis_result JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- GANTT TASKS
-- =====================
CREATE TABLE IF NOT EXISTS gantt_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id),
  name             TEXT NOT NULL,
  name_zh          TEXT,
  trade            TEXT,
  start_date       DATE,
  end_date         DATE,
  duration         INTEGER DEFAULT 1,
  progress         INTEGER DEFAULT 0,
  dependencies     TEXT[],
  color            TEXT DEFAULT '#64748B',
  is_critical      BOOLEAN DEFAULT false,
  subtasks         JSONB DEFAULT '[]',
  assigned_workers JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PAYMENT PHASES
-- =====================
CREATE TABLE IF NOT EXISTS payment_phases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id),
  phase_number   INTEGER,
  label          TEXT,
  amount         NUMERIC(12,2) DEFAULT 0,
  percentage     NUMERIC(5,2),
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid')),
  due_date       DATE,
  paid_date      DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- AI USAGE
-- =====================
CREATE TABLE IF NOT EXISTS ai_usage (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL, -- e.g. '2025-01'
  usage_count  INTEGER DEFAULT 0,
  UNIQUE(user_id, year_month)
);

-- RPC to safely increment AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_year_month TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage (user_id, year_month, usage_count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET usage_count = ai_usage.usage_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- DESIGNER WORKERS
-- =====================
CREATE TABLE IF NOT EXISTS designer_workers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  designer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES auth.users(id),
  user_id     UUID REFERENCES auth.users(id),
  name        TEXT,
  phone       TEXT,
  trades      TEXT[],
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SITE PHOTOS
-- =====================
CREATE TABLE IF NOT EXISTS site_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  uploaded_by  UUID REFERENCES auth.users(id),
  url          TEXT NOT NULL,
  caption      TEXT,
  trade        TEXT,
  approved     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- COST RECORDS (worker receipts)
-- =====================
CREATE TABLE IF NOT EXISTS cost_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID REFERENCES projects(id),
  user_id      UUID REFERENCES auth.users(id),
  uploaded_by  UUID REFERENCES auth.users(id),
  supplier     TEXT,
  receipt_date DATE,
  receipt_number TEXT,
  category     TEXT,
  description  TEXT,
  amount       NUMERIC(12,2) DEFAULT 0,
  items        JSONB DEFAULT '[]',
  receipt_url  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRICE DATA POINTS (auto-learned from quotations)
-- =====================
CREATE TABLE IF NOT EXISTS price_data_points (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category    TEXT NOT NULL,
  item_name   TEXT,
  unit        TEXT,
  unit_price  NUMERIC(10,2),
  supply_type TEXT DEFAULT 'supply_install',
  region      TEXT DEFAULT 'MY_KL',
  source      TEXT DEFAULT 'quotation',
  project_id  UUID,
  confidence  NUMERIC(3,2) DEFAULT 0.8,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRICE DATABASE (aggregated)
-- =====================
CREATE TABLE IF NOT EXISTS price_database (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category     TEXT NOT NULL,
  item_name    TEXT,
  unit         TEXT,
  supply_type  TEXT DEFAULT 'supply_install',
  region       TEXT DEFAULT 'MY_KL',
  min_price    NUMERIC(10,2),
  avg_price    NUMERIC(10,2),
  max_price    NUMERIC(10,2),
  sample_count INTEGER DEFAULT 0,
  confidence   TEXT DEFAULT 'low' CHECK (confidence IN ('low', 'mid', 'high')),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, unit, supply_type, region)
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gantt_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_database ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write own profile
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = user_id);

-- Projects: users see own projects
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- Quotations: users see own
CREATE POLICY "quotations_own" ON project_quotations FOR ALL USING (auth.uid() = user_id);

-- Gantt: users see own
CREATE POLICY "gantt_own" ON gantt_tasks FOR ALL USING (auth.uid() = user_id);

-- Payments: users see own
CREATE POLICY "payments_own" ON payment_phases FOR ALL USING (auth.uid() = user_id);

-- AI usage: users see own
CREATE POLICY "ai_usage_own" ON ai_usage FOR ALL USING (auth.uid() = user_id);

-- Designer workers: designer sees own workers
CREATE POLICY "designer_workers_own" ON designer_workers FOR ALL USING (auth.uid() = designer_id);

-- Site photos: uploader or project owner
CREATE POLICY "site_photos_own" ON site_photos FOR ALL USING (auth.uid() = user_id OR auth.uid() = uploaded_by);

-- Cost records: users see own
CREATE POLICY "cost_records_own" ON cost_records FOR ALL USING (auth.uid() = user_id OR auth.uid() = uploaded_by);

-- Price data: anyone can read, auth users can insert
CREATE POLICY "price_data_read" ON price_data_points FOR SELECT USING (true);
CREATE POLICY "price_data_insert" ON price_data_points FOR INSERT WITH CHECK (true);

-- Price database: anyone can read
CREATE POLICY "price_db_read" ON price_database FOR SELECT USING (true);
CREATE POLICY "price_db_write" ON price_database FOR ALL USING (true);

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-photos', 'site-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('quotations', 'quotations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('site-photos', 'receipts', 'quotations') AND auth.role() = 'authenticated');

CREATE POLICY "storage_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('site-photos', 'receipts', 'quotations'));
