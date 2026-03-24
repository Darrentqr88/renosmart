-- Fix payment_phases RLS to allow access via project ownership
-- The old policy "auth.uid() = user_id" fails when user_id is null or JWT timing issues
DROP POLICY IF EXISTS "payments_own" ON payment_phases;

CREATE POLICY "payments_own" ON payment_phases
FOR ALL
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = payment_phases.project_id
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = payment_phases.project_id
      AND projects.user_id = auth.uid()
  )
);
