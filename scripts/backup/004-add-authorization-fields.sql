-- 004-add-authorization-fields.sql
-- Add missing columns to payment_authorizations table

ALTER TABLE payment_authorizations
ADD COLUMN IF NOT EXISTS currency TEXT CHECK (currency IN ('USD', 'BS')),
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update RLS policies if necessary (existing one covers all columns for authenticated users)
-- CREATE POLICY ...
