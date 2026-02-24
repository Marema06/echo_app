-- Fix: Allow users to insert their own profile
-- Run this in Supabase SQL Editor

-- Add INSERT policy for users table (was missing!)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Optional: Auto-create user profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
