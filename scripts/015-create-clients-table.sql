-- Create the clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('V', 'E', 'J', 'G', 'R', 'P')),
  document_number TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL CHECK (branch IN ('Sucursal Central', 'Sucursal Este', 'Sucursal Norte', 'Sucursal Sur')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users on clients" 
ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on clients" 
ON public.clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on clients" 
ON public.clients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on clients" 
ON public.clients FOR DELETE TO authenticated USING (true);

-- Enable realtime functionality
begin;
  -- remove the supabase_realtime publication
  drop publication if exists supabase_realtime;
  -- re-create the supabase_realtime publication with no tables
  create publication supabase_realtime;
commit;
-- add tables to the publication
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.income;
alter publication supabase_realtime add table public.payroll;
alter publication supabase_realtime add table public.payment_orders;
alter publication supabase_realtime add table public.banks;
alter publication supabase_realtime add table public.user_permissions;
alter publication supabase_realtime add table public.clients;
