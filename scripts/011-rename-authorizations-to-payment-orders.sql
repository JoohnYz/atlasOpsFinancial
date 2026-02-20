-- Migration to rename Authorizations to Payment Orders
-- Run this in the Supabase SQL Editor

-- 1. Rename table payment_authorizations to payment_orders
ALTER TABLE payment_authorizations RENAME TO payment_orders;

-- 2. Rename columns in user_permissions
ALTER TABLE user_permissions RENAME COLUMN access_authorizations TO access_payment_orders;
ALTER TABLE user_permissions RENAME COLUMN manage_authorizations TO manage_payment_orders;

-- 3. Update Indexes (Optional but recommended for consistency)
ALTER INDEX IF EXISTS idx_payment_auth_status RENAME TO idx_payment_order_status;
ALTER INDEX IF EXISTS idx_payment_auth_date RENAME TO idx_payment_order_date;

-- 4. Update Policies
-- We need to drop and recreate policies on the renamed table if they weren't automatically handled or use generic names
-- Usually Supabase handles the rename, but it's good to be explicit for clarity.
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON payment_orders;
CREATE POLICY "Enable read/write for authenticated users" ON payment_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
