-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  access_income BOOLEAN DEFAULT false,
  access_expenses BOOLEAN DEFAULT false,
  access_staff BOOLEAN DEFAULT false,
  access_payroll BOOLEAN DEFAULT false,
  access_reports BOOLEAN DEFAULT false,
  access_authorizations BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_user_permissions_email ON user_permissions(email);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_permissions' AND policyname = 'Users can view their own permissions'
    ) THEN
        CREATE POLICY "Users can view their own permissions" ON user_permissions
          FOR SELECT USING (auth.jwt() ->> 'email' = email);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_permissions' AND policyname = 'Admins can do everything'
    ) THEN
        CREATE POLICY "Admins can do everything" ON user_permissions
          FOR ALL USING (auth.jwt() ->> 'email' = 'admin@atlasops.com');
    END IF;
END $$;
