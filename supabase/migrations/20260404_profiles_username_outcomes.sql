-- ─────────────────────────────────────────────────────────────
-- Migration: profiles.username + college + offer_outcomes table
-- Run in Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────

-- 1. Add username + college to existing profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS college  TEXT;

-- Index for /u/[username] lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- 2. Public read on profiles (needed for /u/[username] page)
DROP POLICY IF EXISTS "profiles: public select by username" ON profiles;
CREATE POLICY "profiles: public select by username"
  ON profiles FOR SELECT
  USING (TRUE);

-- (The existing owner-only policies remain for insert/update)


-- 3. offer_outcomes table — Layer 3 seed
-- Snapshot of portfolio state at moment of offer acceptance
CREATE TABLE IF NOT EXISTS offer_outcomes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id   UUID UNIQUE,
  company          TEXT NOT NULL,
  role             TEXT NOT NULL,
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  portfolio_score  INTEGER,
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE offer_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_outcomes: owner all"
  ON offer_outcomes FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_offer_outcomes_user     ON offer_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_outcomes_company  ON offer_outcomes(company);
CREATE INDEX IF NOT EXISTS idx_offer_outcomes_score    ON offer_outcomes(portfolio_score);
