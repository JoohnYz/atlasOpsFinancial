-- Create the branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  manager TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users on branches" 
ON public.branches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on branches" 
ON public.branches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on branches" 
ON public.branches FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on branches" 
ON public.branches FOR DELETE TO authenticated USING (true);

-- Update realtime publication
alter publication supabase_realtime add table public.branches;
