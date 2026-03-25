-- Migration 013: Allow project owner to read and update variation_orders
-- The owner is identified by projects.owner_email matching their auth email
-- Uses auth.email() built-in (auth.users table is not directly accessible)

-- Allow owner to SELECT variation_orders (so they can see pending VOs)
DROP POLICY IF EXISTS "variation_orders_owner_read" ON variation_orders;
CREATE POLICY "variation_orders_owner_read" ON variation_orders
  FOR SELECT USING (
    (SELECT owner_email FROM projects WHERE id = project_id) = auth.email()
  );

-- Allow owner to UPDATE variation_orders (approve/reject)
DROP POLICY IF EXISTS "variation_orders_owner_update" ON variation_orders;
CREATE POLICY "variation_orders_owner_update" ON variation_orders
  FOR UPDATE USING (
    (SELECT owner_email FROM projects WHERE id = project_id) = auth.email()
  );
