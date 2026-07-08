-- ============================================================
-- 023: Fix infinite recursion in projects RLS policy
-- The projects_team_read policy called auth_is_in_same_team()
-- which queries teams/team_members tables that have their own
-- RLS policies, causing infinite recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS.
-- ============================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "projects_team_read" ON projects;

-- Create a SECURITY DEFINER function specifically for project team reads
-- This bypasses RLS on teams/team_members/profiles tables
CREATE OR REPLACE FUNCTION auth_can_read_project(p_designer_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    -- Own projects
    p_designer_id = auth.uid()
    OR
    -- Same team via profiles.team_id
    EXISTS (
      SELECT 1
      FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid()
        AND p2.user_id = p_designer_id
        AND p1.team_id = p2.team_id
        AND p1.team_id IS NOT NULL
    )
    OR
    -- Current user is team owner, designer is active member
    EXISTS (
      SELECT 1
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE t.owner_user_id = auth.uid()
        AND tm.user_id = p_designer_id
        AND tm.status = 'active'
    )
    OR
    -- Current user is team member, designer is the team owner
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN teams t ON t.id = p.team_id
      WHERE p.user_id = auth.uid()
        AND t.owner_user_id = p_designer_id
        AND p.team_id IS NOT NULL
    )
$$;

-- Re-create with the safe function
CREATE POLICY "projects_team_read" ON projects
  FOR SELECT USING (auth_can_read_project(designer_id));

-- Also fix gantt and payment policies if they use auth_is_in_same_team
DROP POLICY IF EXISTS "gantt_team_read" ON gantt_tasks;
DROP POLICY IF EXISTS "payments_team_read" ON payment_phases;
