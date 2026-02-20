-- Migration to add Banks table and access_banks permission
-- Run this in the Supabase SQL Editor

-- 1. Create Banks Table
CREATE TABLE IF NOT EXISTS banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add access_banks column to user_permissions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_permissions' AND COLUMN_NAME = 'access_banks') THEN
        ALTER TABLE user_permissions ADD COLUMN access_banks BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Enable RLS on banks
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for banks (Allow authenticated users)
DROP POLICY IF EXISTS "Allow read/write for banks to authenticated users" ON banks;
CREATE POLICY "Allow read/write for banks to authenticated users" ON banks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
