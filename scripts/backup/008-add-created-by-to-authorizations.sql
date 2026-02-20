-- Add created_by column to payment_authorizations table
ALTER TABLE payment_authorizations 
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Update existing records to admin for safety (optional)
UPDATE payment_authorizations 
SET created_by = 'admin@atlasops.com' 
WHERE created_by IS NULL;
