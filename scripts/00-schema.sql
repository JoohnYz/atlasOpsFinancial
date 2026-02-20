-- AtlasOps Financial - Consolidated Database Schema
-- Optimized and Unified Structure

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  salary DECIMAL(12, 2) NOT NULL,
  hire_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'expense', -- 'income' or 'expense'
  color VARCHAR(50),
  emoji VARCHAR(10) DEFAULT '📁',
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income Table
CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  client VARCHAR(255),
  notes TEXT,
  invoice_url TEXT,
  invoice_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  vendor VARCHAR(255),
  notes TEXT,
  invoice_url TEXT,
  invoice_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  net_salary DECIMAL(12, 2),
  period VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  payment_date DATE,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  invoice_url TEXT,
  invoice_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Authorizations Table
CREATE TABLE IF NOT EXISTS payment_authorizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- 'Pago móvil', 'Transferencia Bancaria', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  currency TEXT CHECK (currency IN ('USD', 'BS')),
  bank_name TEXT,
  phone_number TEXT,
  account_number TEXT,
  document_type TEXT,
  document_number TEXT,
  email TEXT, -- Contact/Recipient email
  created_by TEXT, -- Email of the creator
  is_rectified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  access_income BOOLEAN DEFAULT false,
  access_expenses BOOLEAN DEFAULT false,
  access_staff BOOLEAN DEFAULT false,
  access_payroll BOOLEAN DEFAULT false,
  access_reports BOOLEAN DEFAULT false,
  access_authorizations BOOLEAN DEFAULT false,
  access_categories BOOLEAN DEFAULT false,
  manage_authorizations BOOLEAN DEFAULT false,
  assign_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_payroll_staff_id ON payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_payment_auth_status ON payment_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_payment_auth_date ON payment_authorizations(date);
CREATE INDEX IF NOT EXISTS idx_user_permissions_email ON user_permissions(email);

-- 4. SECURITY (RLS & Policies)

-- Enable RLS
ALTER TABLE payment_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Functions
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

-- Policies for payment_authorizations
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON payment_authorizations;
CREATE POLICY "Enable read/write for authenticated users" ON payment_authorizations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for user_permissions
DROP POLICY IF EXISTS "Allow specialized access" ON user_permissions;
CREATE POLICY "Allow specialized access" ON user_permissions
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'admin@atlasops.com') OR 
  (email = (auth.jwt() ->> 'email')) OR 
  (check_is_manager())
);
