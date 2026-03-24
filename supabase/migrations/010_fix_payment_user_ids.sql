-- Backfill null user_id in payment_phases from parent project's user_id
-- This fixes RLS so DELETE/SELECT work correctly
UPDATE payment_phases pp
SET user_id = p.user_id
FROM projects p
WHERE pp.project_id = p.id
  AND pp.user_id IS NULL
  AND p.user_id IS NOT NULL;
