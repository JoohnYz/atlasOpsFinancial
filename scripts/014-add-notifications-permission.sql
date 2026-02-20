-- Add access_notifications column to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS access_notifications BOOLEAN DEFAULT false;

-- Ensure admin has this permission by default
UPDATE user_permissions 
SET access_notifications = true 
WHERE email = 'admin@atlasops.com';
