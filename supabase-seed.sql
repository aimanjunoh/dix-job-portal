-- DIX Job Portal - Seed Data
-- Run this AFTER running supabase-schema.sql

-- First, create auth users via Supabase dashboard or use the app's signup
-- Then insert into our users table. For demo, we'll create users via SQL:

-- Create admin user (you'll need to create auth users first via Supabase Auth dashboard)
-- For testing, you can use Supabase Auth > Users > Add User

-- Insert sample users (after creating auth accounts)
-- INSERT INTO users (id, name, email, role, department, status) VALUES
--   ('UUID-1', 'Admin', 'admin@dix.local', 'admin', 'Management', 'active'),
--   ('UUID-2', 'Aiman', 'aiman@dix.local', 'staff', 'Web Development', 'active'),
--   ('UUID-3', 'Fakhrul', 'fakhrul@dix.local', 'staff', 'Design', 'active');

-- For now, let's insert sample requests (replace UUIDs with actual user IDs)
-- INSERT INTO requests (request_id, title, requester_name, requester_email, department, category, urgency, description, status, remarks) VALUES
--   ('REQ-0001', 'Homepage Banner Update', 'Marketing Team', 'marketing@company.com', 'Marketing', 'Web', 'Urgent', 'Update the main banner.', 'New', ''),
--   ('REQ-0002', 'Employee Onboarding Portal', 'HR Department', 'hr@company.com', 'HR', 'Web App', 'Critical', 'Build onboarding portal.', 'New', ''),
--   ('REQ-0003', 'Monthly Report Dashboard', 'Finance Team', 'finance@company.com', 'Finance', 'Dashboard', 'Normal', 'Create dashboard.', 'New', '');
