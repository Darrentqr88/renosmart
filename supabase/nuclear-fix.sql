-- NUCLEAR FIX: Drop & recreate profiles cleanly
-- Safe to run since no real user data exists yet

-- 1. Remove old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Drop old profiles table (previous schemas had wrong structure)
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Recreate profiles with correct structure
CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 5. Recreate trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Also fix ai_usage
CREATE TABLE IF NOT EXISTS ai_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month  TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  UNIQUE(user_id, year_month)
);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_own" ON ai_usage;
CREATE POLICY "ai_usage_own" ON ai_usage FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_year_month TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO ai_usage (user_id, year_month, usage_count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET usage_count = ai_usage.usage_count + 1;
END;
$$;

SELECT 'Fix complete - try registering now' AS status;
