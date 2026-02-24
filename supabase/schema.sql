-- ============================================================
-- ECHO. - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- Table: entries
-- ============================================================
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis JSONB NOT NULL,
  visualization_url TEXT NOT NULL,
  visualization_style TEXT NOT NULL,
  tags TEXT[]
);

-- Index for fast user queries
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_created_at ON entries(created_at DESC);

-- ============================================================
-- Table: subscriptions
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Entries table RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions table RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
