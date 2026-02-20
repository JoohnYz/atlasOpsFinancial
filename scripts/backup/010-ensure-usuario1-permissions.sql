-- Ensure all columns exist in user_permissions table before performing operations
DO $$ 
BEGIN
    -- access_categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'access_categories') THEN
        ALTER TABLE user_permissions ADD COLUMN access_categories BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- manage_authorizations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'manage_authorizations') THEN
        ALTER TABLE user_permissions ADD COLUMN manage_authorizations BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- assign_access
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_permissions' AND column_name = 'assign_access') THEN
        ALTER TABLE user_permissions ADD COLUMN assign_access BOOLEAN DEFAULT FALSE;
    END IF;

    -- created_by in payment_authorizations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_authorizations' AND column_name = 'created_by') THEN
        ALTER TABLE payment_authorizations ADD COLUMN created_by TEXT;
    END IF;
END $$;

-- Ensure usuario1@gmail.com has permissions
INSERT INTO user_permissions (
    email, 
    assign_access, 
    access_income, 
    access_expenses, 
    access_staff, 
    access_payroll, 
    access_reports, 
    access_authorizations, 
    access_categories, 
    manage_authorizations
)
VALUES (
    'usuario1@gmail.com', 
    TRUE, -- assign_access
    TRUE, -- access_income
    TRUE, -- access_expenses
    TRUE, -- access_staff
    TRUE, -- access_payroll
    TRUE, -- access_reports
    TRUE, -- access_authorizations
    TRUE, -- access_categories
    TRUE  -- manage_authorizations
)
ON CONFLICT (email) 
DO UPDATE SET 
    assign_access = EXCLUDED.assign_access,
    access_categories = EXCLUDED.access_categories,
    manage_authorizations = EXCLUDED.manage_authorizations;

-- Ensure admin also has these permissions
UPDATE user_permissions 
SET 
    assign_access = TRUE,
    access_categories = TRUE,
    manage_authorizations = TRUE
WHERE email = 'admin@atlasops.com';

-- Create a function to check if the current user has assign_access
-- SECURITY DEFINER allows this function to bypass RLS internally
CREATE OR REPLACE FUNCTION check_is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE email = (auth.jwt() ->> 'email') 
      AND assign_access = TRUE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS Policies to allow managers (not just the main admin) to manage permissions
DROP POLICY IF EXISTS "Managers and Admins can manage permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow specialized access" ON user_permissions;

CREATE POLICY "Allow specialized access" ON user_permissions
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'admin@atlasops.com') OR 
  (email = (auth.jwt() ->> 'email')) OR 
  (check_is_manager())
);
