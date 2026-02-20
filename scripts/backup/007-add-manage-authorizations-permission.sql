-- Add manage_authorizations column to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS manage_authorizations BOOLEAN DEFAULT FALSE;

-- Update admin user to always have manage_authorizations permission
-- Note: Replace 'admin@atlasops.com' with the actual admin email if different
UPDATE user_permissions 
SET manage_authorizations = TRUE 
WHERE email = 'admin@atlasops.com';
