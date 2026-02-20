-- Add access_categories column to user_permissions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_permissions' AND column_name = 'access_categories'
    ) THEN
        ALTER TABLE user_permissions ADD COLUMN access_categories BOOLEAN DEFAULT false;
    END IF;
END $$;
