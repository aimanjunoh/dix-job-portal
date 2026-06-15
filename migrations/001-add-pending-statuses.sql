-- Migration: Add pending status values to requests status CHECK constraint
-- Adds 'Pending Content', 'Pending Approval', 'Pending Vendor'
-- Run this in Supabase SQL Editor to update the live database.

-- Drop existing constraint and recreate with expanded values
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check
  CHECK (status IN ('New', 'In Progress', 'Pending Info', 'Pending Content', 'Pending Approval', 'Pending Vendor', 'Completed'));
