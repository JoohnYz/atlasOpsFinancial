-- Create payment_authorizations table
CREATE TABLE IF NOT EXISTS payment_authorizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- 'Pago móvil', 'Transferencia Bancaria', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_authorizations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read/write for authenticated users" ON payment_authorizations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_auth_status ON payment_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_payment_auth_date ON payment_authorizations(date);
