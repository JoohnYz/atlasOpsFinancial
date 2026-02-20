-- AtlasOps Financial - Enable Supabase Realtime
-- This script adds the core tables to the supabase_realtime publication

-- Check if the publication exists, if not create it (standard in Supabase)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to the publication
-- This allows the Supabase client to listen to changes on these tables
ALTER PUBLICATION supabase_realtime ADD TABLE payment_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE banks;
ALTER PUBLICATION supabase_realtime ADD TABLE income;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE payroll;
ALTER PUBLICATION supabase_realtime ADD TABLE user_permissions;

-- Note: Ensure 'Replica Identity' is set to FULL if you need to receive the old record in updates/deletes
-- For our basic use case (refreshing lists), the default (DEFAULT) usually suffices.
ALTER TABLE payment_orders REPLICA IDENTITY FULL;
ALTER TABLE banks REPLICA IDENTITY FULL;
ALTER TABLE income REPLICA IDENTITY FULL;
ALTER TABLE expenses REPLICA IDENTITY FULL;
ALTER TABLE payroll REPLICA IDENTITY FULL;
ALTER TABLE user_permissions REPLICA IDENTITY FULL;
