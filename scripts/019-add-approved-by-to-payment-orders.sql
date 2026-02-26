-- Migration to add approved_by to payment_orders and update RLS on user_signatures
-- Run this in the Supabase SQL Editor

-- 1. Add column to payment_orders
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);

-- 2. Drop existing policy (to replace it safely if needed)
DROP POLICY IF EXISTS "Allow any user to read other user signatures for PDF generation" ON user_signatures;

-- 3. Allow all authenticated users to read any signature (required for PDF signature matching)
CREATE POLICY "Allow any user to read other user signatures for PDF generation" ON user_signatures
  FOR SELECT TO authenticated USING (true);
