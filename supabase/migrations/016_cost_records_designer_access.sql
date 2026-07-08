-- =====================================================================
-- 016: Allow designers to READ cost_records for their own projects
-- =====================================================================
-- Current RLS: cost_records_own allows only user_id/uploaded_by match.
-- Workers upload receipts (user_id = worker), so designers can't see them.
-- Fix: add a SELECT policy that lets project owners see cost_records.

-- Designer can SELECT cost_records where project belongs to them
DROP POLICY IF EXISTS "cost_records_project_owner_read" ON cost_records;
CREATE POLICY "cost_records_project_owner_read" ON cost_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = cost_records.project_id
        AND p.user_id = auth.uid()
    )
  );

-- Also allow designers to INSERT cost_records for their own projects
DROP POLICY IF EXISTS "cost_records_project_owner_insert" ON cost_records;
CREATE POLICY "cost_records_project_owner_insert" ON cost_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = cost_records.project_id
        AND p.user_id = auth.uid()
    )
  );
