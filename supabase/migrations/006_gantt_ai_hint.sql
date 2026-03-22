-- Migration 006: Add ai_hint JSONB column to gantt_tasks for persisting batch-generated hints
-- Also adds source_items, sort_order, phase_group if not already present
-- All ADD COLUMN IF NOT EXISTS are idempotent — safe to run multiple times

ALTER TABLE gantt_tasks
  ADD COLUMN IF NOT EXISTS ai_hint JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_items TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase_group TEXT DEFAULT 'construction';

COMMENT ON COLUMN gantt_tasks.ai_hint IS 'Batch-generated AI trade hint (prepItems, warnings, quotationNotes) — persisted after Gantt generation';
COMMENT ON COLUMN gantt_tasks.source_items IS 'Quotation item names matched to this task';
COMMENT ON COLUMN gantt_tasks.sort_order IS 'Display order within the Gantt chart';
COMMENT ON COLUMN gantt_tasks.phase_group IS 'Phase grouping: design | preparation | construction';
