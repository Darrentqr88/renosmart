-- Migration 029: Resolve Supabase security advisor warnings
--
-- Addresses three classes of warnings:
--   1. function_search_path_mutable (12 functions)
--   2. rls_policy_always_true (5 permissive INSERT/ALL policies on price/cost tables)
--   3. extension_in_public (pg_trgm — unused, dropped)
--
-- The leaked-password-protection warning is a Dashboard-only Auth setting
-- (Auth → Providers → Email → "Prevent use of leaked passwords") and cannot
-- be toggled from SQL. Enable it manually after applying this migration.

-- ═══════════════════════════════════════════════════════════
-- 1. Lock function search_path on all flagged functions
-- ═══════════════════════════════════════════════════════════
-- Mutable search_path lets an attacker create a same-named function in a
-- schema earlier on the path and have it called instead. Pinning to
-- (public, pg_temp) eliminates that vector. Done dynamically so all
-- overloads of increment_ai_usage are caught and missing functions are
-- skipped silently.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'update_teams_updated_at',
        'update_updated_at',
        'auth_is_team_owner',
        'auth_is_team_member',
        'auth_can_read_project',
        'increment_ai_usage',
        'auth_get_role',
        'auth_get_team_id',
        'auth_user_team_id',
        'auth_is_designer',
        'auth_is_in_same_team'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name, fn.func_name, fn.args
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 2. Tighten permissive RLS policies on price/cost tables
-- ═══════════════════════════════════════════════════════════
-- These tables previously had INSERT/ALL policies with WITH CHECK (true)
-- so the API routes could write through the anon key. The routes now use
-- the service role key (which bypasses RLS), so we can drop the
-- permissive policies entirely. SELECT remains open so the price/cost
-- intelligence pages can read aggregated data from the browser.

-- ── price_data_points ──
DROP POLICY IF EXISTS "Allow anon insert"          ON public.price_data_points;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.price_data_points;
-- Keep public SELECT for aggregated browsing
DROP POLICY IF EXISTS "price_data_points_read"     ON public.price_data_points;
CREATE POLICY "price_data_points_read"
  ON public.price_data_points FOR SELECT USING (true);

-- ── price_database ──
DROP POLICY IF EXISTS "Allow anon upsert"     ON public.price_database;
DROP POLICY IF EXISTS "price_database_read"   ON public.price_database;
CREATE POLICY "price_database_read"
  ON public.price_database FOR SELECT USING (true);

-- ── cost_data_points ──
DROP POLICY IF EXISTS "cost_data_points_insert" ON public.cost_data_points;
-- cost_data_points_read (FOR SELECT USING true) already exists from migration 017 — leave it.

-- ── cost_database ──
DROP POLICY IF EXISTS "cost_database_upsert" ON public.cost_database;
-- cost_database_read (FOR SELECT USING true) already exists from migration 017 — leave it.

-- ═══════════════════════════════════════════════════════════
-- 3. Drop unused pg_trgm extension from public schema
-- ═══════════════════════════════════════════════════════════
-- No code in this repo calls similarity(), uses % operators, or creates
-- trigram indexes. Safe to drop. If trigram search is added later, install
-- it into the dedicated `extensions` schema instead:
--   CREATE EXTENSION pg_trgm WITH SCHEMA extensions;
DROP EXTENSION IF EXISTS pg_trgm;
