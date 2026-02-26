-- Migration to add user_signatures table
-- Run this in the Supabase SQL Editor

-- 1. Create User Signatures Table
CREATE TABLE IF NOT EXISTS user_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  signer_name VARCHAR(255) NOT NULL,
  signature_data TEXT NOT NULL, -- Storing base64 image data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy for user_signatures (Allow authenticated users to read/write their own signatures)
DROP POLICY IF EXISTS "Allow users to read and write their own signatures" ON user_signatures;
CREATE POLICY "Allow users to read and write their own signatures" ON user_signatures
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);

-- Allow superadmin access to read all signatures if needed (optional)
DROP POLICY IF EXISTS "Allow admin to read all signatures" ON user_signatures;
CREATE POLICY "Allow admin to read all signatures" ON user_signatures
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'admin@atlasops.com');
