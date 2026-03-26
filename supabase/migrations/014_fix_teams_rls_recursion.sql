-- Migration 014: Fix infinite recursion in teams/team_members RLS policies
-- Root cause: teams policy queries team_members, team_members policy queries teams → loop
-- Fix: use SECURITY DEFINER functions that bypass RLS when checking the other table

-- Drop the two recursive policies
DROP POLICY IF EXISTS "team_member_select" ON teams;
DROP POLICY IF EXISTS "owner_manage_members" ON team_members;

-- SECURITY DEFINER function: check if current user owns a given team
-- Runs as postgres (bypasses RLS on teams table)
CREATE OR REPLACE FUNCTION auth_is_team_owner(p_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams WHERE id = p_team_id AND owner_user_id = auth.uid()
  )
$$;

-- SECURITY DEFINER function: check if current user is active member of a given team
-- Runs as postgres (bypasses RLS on team_members table)
CREATE OR REPLACE FUNCTION auth_is_team_member(p_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = auth.uid() AND status = 'active'
  )
$$;

-- Re-create team_member_select on teams using SECURITY DEFINER function (no recursion)
CREATE POLICY "team_member_select" ON teams
  FOR SELECT USING (auth_is_team_member(id));

-- Re-create owner_manage_members on team_members using SECURITY DEFINER function (no recursion)
CREATE POLICY "owner_manage_members" ON team_members
  FOR ALL USING (auth_is_team_owner(team_id));
