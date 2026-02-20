-- Add manage_banks column to user_permissions
ALTER TABLE user_permissions ADD COLUMN manage_banks BOOLEAN DEFAULT FALSE;

-- Grant manage_banks to super-admin
UPDATE user_permissions SET manage_banks = TRUE WHERE email = 'admin@atlasops.com';
