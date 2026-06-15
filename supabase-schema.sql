-- DIX Job Portal - Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  department TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Requests table
CREATE TABLE IF NOT EXISTS requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT DEFAULT '',
  department TEXT DEFAULT '',
  category TEXT DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Normal', 'Urgent', 'Critical')),
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Pending Info', 'Pending Content', 'Pending Approval', 'Pending Vendor', 'Completed')),
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id BIGINT REFERENCES requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_request_id ON activity_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- 5. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can read all users, but only update themselves
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service can insert users" ON users FOR INSERT WITH CHECK (true);

-- Requests: authenticated users can read, but with logic handled in app
CREATE POLICY "Authenticated users can view requests" ON requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert requests" ON requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update requests" ON requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete requests" ON requests FOR DELETE USING (auth.role() = 'authenticated');

-- Activity logs: authenticated users can read and insert
CREATE POLICY "Authenticated users can view logs" ON activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert logs" ON activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Function to generate request IDs
CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS TEXT AS $$
DECLARE
  last_id TEXT;
  num INT;
BEGIN
  SELECT request_id INTO last_id FROM requests ORDER BY id DESC LIMIT 1;
  IF last_id IS NULL THEN
    RETURN 'REQ-0001';
  END IF;
  num := CAST(SUBSTRING(last_id FROM 5) AS INT) + 1;
  RETURN 'REQ-' || LPAD(num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
