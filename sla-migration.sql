-- SLA Enhancement Migration
-- Adds SLA tracking columns to requests table

-- Add SLA columns
ALTER TABLE requests ADD COLUMN IF NOT EXISTS sla_due_date DATE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'Within SLA';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS sla_paused_days INTEGER DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS sla_paused_at TIMESTAMPTZ;

-- Check constraint for SLA status values
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_sla_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_sla_status_check 
  CHECK (sla_status IN ('Within SLA', 'Approaching SLA', 'Overdue', 'Paused'));

-- Index for SLA queries (dashboard widgets)
CREATE INDEX IF NOT EXISTS idx_requests_sla_status ON requests(sla_status);
CREATE INDEX IF NOT EXISTS idx_requests_sla_due_date ON requests(sla_due_date);
