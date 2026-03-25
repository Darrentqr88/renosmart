-- Migration 008: Add items JSONB and file_name to variation_orders
-- Run this in Supabase SQL editor

ALTER TABLE variation_orders
  ADD COLUMN IF NOT EXISTS items     JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS file_name TEXT;
