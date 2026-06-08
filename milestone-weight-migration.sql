-- Milestone Weight Migration
-- Adds weight tracking to project milestones for weighted progress calculation

-- Add weight column (percentage, 0-100)
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 0;

-- Check constraint: weight between 0 and 100
ALTER TABLE project_milestones DROP CONSTRAINT IF EXISTS project_milestones_weight_check;
ALTER TABLE project_milestones ADD CONSTRAINT project_milestones_weight_check
  CHECK (weight >= 0 AND weight <= 100);
