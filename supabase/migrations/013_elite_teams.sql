-- Migration 013: Elite Team Plan
-- Each Elite bundle = 5 accounts + 250 shared AI uses/month
-- Owner can purchase multiple bundles to expand team

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'My Team',
  elite_slots   INTEGER NOT NULL DEFAULT 1, -- Each slot = 5 members + 250 uses/month
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ
);

-- Add team_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);

-- RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team owner can fully manage their team
CREATE POLICY "team_owner_all" ON teams
  FOR ALL USING (owner_user_id = auth.uid());

-- Active members can view their team
CREATE POLICY "team_member_select" ON teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owner can manage all members in their teams
CREATE POLICY "owner_manage_members" ON team_members
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE owner_user_id = auth.uid())
  );

-- Members can view their own record
CREATE POLICY "member_view_self" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Pending invitees can view their invite by email
CREATE POLICY "invitee_view_by_email" ON team_members
  FOR SELECT USING (
    email = (
      SELECT email FROM profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Updated_at trigger for teams
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_teams_updated_at();
