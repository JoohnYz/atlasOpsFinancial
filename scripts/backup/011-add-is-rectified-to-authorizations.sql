-- 011-add-is-rectified-to-authorizations.sql
-- Add is_rectified column to track if a payment was edited after being rejected

ALTER TABLE payment_authorizations
ADD COLUMN IF NOT EXISTS is_rectified BOOLEAN DEFAULT FALSE;

-- Update RLS policies if necessary (existing one covers all columns for authenticated users)
-- No changes needed as existing policy is "Enable read/write for authenticated users"
