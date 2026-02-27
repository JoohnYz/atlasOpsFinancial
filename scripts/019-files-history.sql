-- 019-files-history.sql
-- Migration to add uploaded_files table for the File History feature

CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  bucket VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL, -- 'payroll', 'expense', 'income', etc.
  transaction_id UUID, -- Optional link to the specific transaction
  uploaded_by VARCHAR(255) NOT NULL, -- Email of the user who uploaded
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- For soft deletes (Trash feature)
);

-- Indexes for performance on filtering
CREATE INDEX IF NOT EXISTS idx_uploaded_files_module ON uploaded_files(module);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_deleted_at ON uploaded_files(deleted_at);

-- RLS Policies
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert (they upload files)
DROP POLICY IF EXISTS "Enable insert for authenticated users on uploaded_files" ON uploaded_files;
CREATE POLICY "Enable insert for authenticated users on uploaded_files" ON uploaded_files
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to read all non-deleted files, or admins to read everything
-- (We will handle Trash access in the application logic, but they need to be able to read to list them)
DROP POLICY IF EXISTS "Enable read for authenticated users on uploaded_files" ON uploaded_files;
CREATE POLICY "Enable read for authenticated users on uploaded_files" ON uploaded_files
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL OR auth.jwt() ->> 'email' = 'admin@atlasops.com'
  );

-- Allow updates (for moving to trash) by authenticated users (or admin)
DROP POLICY IF EXISTS "Enable update for authenticated users on uploaded_files" ON uploaded_files;
CREATE POLICY "Enable update for authenticated users on uploaded_files" ON uploaded_files
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Only admin can permanently delete
DROP POLICY IF EXISTS "Enable delete for admin on uploaded_files" ON uploaded_files;
CREATE POLICY "Enable delete for admin on uploaded_files" ON uploaded_files
  FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@atlasops.com');
