-- MINIMAL FIX: Only fixes registration (profiles + trigger)
-- Run this in Supabase SQL Editor

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  role            TEXT,
  name            TEXT,
  phone           TEXT,
  company         TEXT,
  company_address TEXT,
  trades          TEXT[],
  plan            TEXT DEFAULT 'free',
  region          TEXT DEFAULT 'MY',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add missing columns if profiles already exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trades TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'MY';

-- Step 3: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Enable RLS on profiles only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop old profile policies and recreate
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Step 7: Create ai_usage table (needed for quota checks)
CREATE TABLE IF NOT EXISTS ai_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month  TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  UNIQUE(user_id, year_month)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_own" ON ai_usage;
CREATE POLICY "ai_usage_own" ON ai_usage FOR ALL USING (auth.uid() = user_id);

-- RPC for incrementing AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_year_month TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage (user_id, year_month, usage_count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET usage_count = ai_usage.usage_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Done! Registration should work now.' AS status;
