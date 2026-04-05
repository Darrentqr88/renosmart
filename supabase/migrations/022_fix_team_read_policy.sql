-- ============================================================
-- 022: Fix projects_team_read policy to avoid 500 errors
-- The previous policy called auth_is_in_same_team() on every row
-- which could cause errors for non-team users or when the function
-- encounters edge cases. This version adds a fast-path for own
-- projects and only calls the function for cross-team reads.
-- ============================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "projects_team_read" ON projects;

-- Re-create with safe guard: own projects always pass, team function only for others
CREATE POLICY "projects_team_read" ON projects
  FOR SELECT USING (
    auth.uid() = designer_id
    OR auth_is_in_same_team(designer_id)
  );

-- Also ensure the function handles NULL input gracefully
CREATE OR REPLACE FUNCTION auth_is_in_same_team(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN p_user_id IS NULL THEN false
    WHEN p_user_id = auth.uid() THEN true
    ELSE (
      SELECT EXISTS (
        SELECT 1
        FROM profiles p1
        JOIN profiles p2 ON p1.team_id = p2.team_id
        WHERE p1.user_id = auth.uid()
          AND p2.user_id = p_user_id
          AND p1.team_id IS NOT NULL
      ) OR EXISTS (
        SELECT 1
        FROM teams t
        JOIN team_members tm ON tm.team_id = t.id
        WHERE t.owner_user_id = auth.uid()
          AND tm.user_id = p_user_id
          AND tm.status = 'active'
      ) OR EXISTS (
        SELECT 1
        FROM profiles p
        JOIN teams t ON t.id = p.team_id
        WHERE p.user_id = auth.uid()
          AND t.owner_user_id = p_user_id
          AND p.team_id IS NOT NULL
      )
    )
  END
$$;
