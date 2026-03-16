-- ============================================================
-- ECHO. - Table: future_letters
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE future_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  text TEXT NOT NULL,
  dominant_emotion TEXT NOT NULL,
  visualization_url TEXT NOT NULL,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_future_letters_send_at ON future_letters(send_at) WHERE sent = false;
CREATE INDEX idx_future_letters_user_id ON future_letters(user_id);

ALTER TABLE future_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own letters"
  ON future_letters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own letters"
  ON future_letters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own letters"
  ON future_letters FOR DELETE
  USING (auth.uid() = user_id);
