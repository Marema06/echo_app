-- Table for anonymous public sharing of entries
CREATE TABLE IF NOT EXISTS shared_entries (
  token      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id)
);

ALTER TABLE shared_entries ENABLE ROW LEVEL SECURITY;

-- Authenticated users manage their own shares
CREATE POLICY "Users manage own shares" ON shared_entries
  FOR ALL USING (auth.uid() = user_id);

-- Public (anon) can read shared entries
CREATE POLICY "Public can read shares" ON shared_entries
  FOR SELECT TO anon USING (true);
