-- Create the vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  rif TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users on vendors" 
ON public.vendors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on vendors" 
ON public.vendors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on vendors" 
ON public.vendors FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on vendors" 
ON public.vendors FOR DELETE TO authenticated USING (true);

-- Update realtime publication
alter publication supabase_realtime add table public.vendors;
