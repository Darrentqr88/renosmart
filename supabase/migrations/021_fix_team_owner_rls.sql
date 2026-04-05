-- ============================================================
-- 021: Fix auth_is_in_same_team() for team owners
-- The owner may not have profiles.team_id set, so the original
-- function (which JOINs profiles on team_id) fails.
-- This version adds fallback paths via the teams table.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_is_in_same_team(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    -- Path 1: Both users have team_id set in profiles (original logic)
    SELECT 1
    FROM profiles p1
    JOIN profiles p2 ON p1.team_id = p2.team_id
    WHERE p1.user_id = auth.uid()
      AND p2.user_id = p_user_id
      AND p1.team_id IS NOT NULL
  ) OR EXISTS (
    -- Path 2: Current user is team owner, target user is an active member
    SELECT 1
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE t.owner_user_id = auth.uid()
      AND tm.user_id = p_user_id
      AND tm.status = 'active'
  ) OR EXISTS (
    -- Path 3: Current user is a team member, target user is the team owner
    SELECT 1
    FROM profiles p
    JOIN teams t ON t.id = p.team_id
    WHERE p.user_id = auth.uid()
      AND t.owner_user_id = p_user_id
      AND p.team_id IS NOT NULL
  )
$$;
