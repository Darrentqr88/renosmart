-- Referral system for growth
-- Add referral_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id),
  referred_user_id UUID NOT NULL REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  UNIQUE (referred_user_id)
);

-- RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Authenticated users can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Shared reports for viral sharing
CREATE TABLE IF NOT EXISTS shared_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID,
  report_data JSONB NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  views INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shared reports" ON shared_reports
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can read shared reports by token" ON shared_reports
  FOR SELECT USING (true);

-- Email events for drip sequences
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email events" ON email_events
  FOR SELECT USING (user_id = auth.uid());

-- Index for referral lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_email_events_user ON email_events(user_id, event_type);
