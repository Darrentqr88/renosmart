-- Migration 007: Add phase_id column to gantt_tasks for static hint/checklist lookup
ALTER TABLE gantt_tasks
  ADD COLUMN IF NOT EXISTS phase_id TEXT DEFAULT NULL;

COMMENT ON COLUMN gantt_tasks.phase_id IS 'Original construction phase ID (e.g. demolition, tiling) for hint/checklist lookup';
