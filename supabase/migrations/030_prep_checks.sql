-- Add prep_checks column to gantt_tasks for persisting checklist checkbox state
ALTER TABLE gantt_tasks ADD COLUMN IF NOT EXISTS prep_checks JSONB DEFAULT '{}';
