-- Add assign_access column to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS assign_access BOOLEAN DEFAULT FALSE;

-- Ensure admin has assign_access by default
-- Note: the actual UUID for admin might vary, but we target by email
UPDATE user_permissions 
SET assign_access = TRUE 
WHERE email = 'admin@atlasops.com';
