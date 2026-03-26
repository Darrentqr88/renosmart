-- Migration 015: Fix RLS policies for team member access
-- Issues fixed:
--   1. team_members: members can only see their own record, not other team members
--   2. ai_usage: members can only read their own usage, breaking team quota display
--   3. profiles: members cannot read team owner's or other members' profiles
--   4. team_members: members have no UPDATE permission to activate their own invite

-- ============================================================
-- 1. Allow team members to SELECT all members in their team
-- ============================================================
-- Currently "member_view_self" only lets members see their own record.
-- We need members to see ALL records in their team for the members list.

CREATE OR REPLACE FUNCTION auth_user_team_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT team_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "member_view_team" ON team_members
  FOR SELECT USING (
    team_id = auth_user_team_id()
  );

-- ============================================================
-- 2. Allow team members to read other team members' ai_usage
-- ============================================================
-- Currently "ai_usage_own" only allows auth.uid() = user_id.
-- Team members need to read each other's usage for quota display.

CREATE OR REPLACE FUNCTION auth_is_in_same_team(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p1
    JOIN profiles p2 ON p1.team_id = p2.team_id
    WHERE p1.user_id = auth.uid()
      AND p2.user_id = p_user_id
      AND p1.team_id IS NOT NULL
  )
$$;

CREATE POLICY "ai_usage_team_read" ON ai_usage
  FOR SELECT USING (
    auth_is_in_same_team(user_id)
  );

-- ============================================================
-- 3. Allow team members to read other team members' profiles
-- ============================================================
-- Currently "profiles_own" only allows auth.uid() = user_id.
-- Team members need to see owner name/email and each other's info.

CREATE POLICY "profiles_team_read" ON profiles
  FOR SELECT USING (
    auth_is_in_same_team(user_id)
  );

-- ============================================================
-- 4. Allow a member to UPDATE their own team_members record
-- ============================================================
-- Needed for the /api/team/join route which activates a pending invite
-- using the member's own session (anon key). Only allow updating own record.

CREATE POLICY "member_update_self" ON team_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also allow a member to update their own record if they're the invitee
-- (before user_id is set, they need to match by email to set user_id)
CREATE POLICY "invitee_update_own" ON team_members
  FOR UPDATE USING (
    email = (SELECT email FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    AND status = 'pending'
  );
