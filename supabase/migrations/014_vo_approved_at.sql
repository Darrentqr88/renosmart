-- Migration 014: Ensure variation_orders has approved_at column
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE variation_orders
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
