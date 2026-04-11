-- Migration 028: Drop orphan worker_ratings table
--
-- Flagged by Supabase security advisor (rls_disabled_in_public).
-- Table was created manually outside migrations and is not referenced by
-- any application code. Rating data is stored on profiles.worker_rating
-- and profiles.rating_breakdown (see migration 016).
--
-- Pre-drop safety check (run in Supabase SQL editor before applying):
--   SELECT COUNT(*) FROM public.worker_ratings;  -- confirmed = 0 on 2026-04-11

DROP TABLE IF EXISTS public.worker_ratings;
