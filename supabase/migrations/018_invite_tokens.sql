-- Worker invite tokens for phone-based login (no OTP)
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  role        TEXT NOT NULL DEFAULT 'worker',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  claimed_by_phone   TEXT,
  claimed_by_user_id UUID REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  claimed_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Designers can read/create their own tokens
CREATE POLICY "invite_tokens_select_own" ON invite_tokens
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "invite_tokens_insert_own" ON invite_tokens
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "invite_tokens_update_own" ON invite_tokens
  FOR UPDATE USING (auth.uid() = created_by);

-- Indexes for fast lookup
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_invite_tokens_created_by ON invite_tokens(created_by);
CREATE INDEX idx_invite_tokens_status ON invite_tokens(status) WHERE status = 'pending';
