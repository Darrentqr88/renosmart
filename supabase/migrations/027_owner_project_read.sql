-- 027: Owner project access
--
-- IMPORTANT: Owner data reads are handled by /api/owner-project using
-- service-role admin client (bypasses RLS). We intentionally do NOT add
-- cross-table SELECT policies on projects/gantt_tasks/payment_phases/
-- site_photos because they cause infinite recursion:
--
--   projects → worker_read_assigned_projects → gantt_tasks
--   gantt_tasks → gantt_owner_read → projects → RECURSION → 500
--
-- The only RLS policy needed is on variation_orders for owner WRITE
-- access (approve/reject VOs), which already exists in 013_vo_owner_rls.sql.
--
-- Cleanup: drop any previously created policies from this migration
-- in case they were applied before this fix.
DROP POLICY IF EXISTS "projects_owner_read" ON projects;
DROP POLICY IF EXISTS "gantt_owner_read" ON gantt_tasks;
DROP POLICY IF EXISTS "payments_owner_read" ON payment_phases;
DROP POLICY IF EXISTS "site_photos_owner_read" ON site_photos;
DROP POLICY IF EXISTS "invite_tokens_claimed_read" ON invite_tokens;
