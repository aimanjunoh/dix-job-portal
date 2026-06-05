-- ============================================
-- DIX Job Portal - Project Management Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  start_date DATE,
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Project members (junction table)
CREATE TABLE IF NOT EXISTS project_members (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 3. Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Project tasks
CREATE TABLE IF NOT EXISTS project_tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id BIGINT REFERENCES project_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Review', 'Done')),
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Project notes/updates (activity feed)
CREATE TABLE IF NOT EXISTS project_notes (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_milestone ON project_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Projects: all authenticated users can read
CREATE POLICY "Users can view projects" ON projects FOR SELECT TO authenticated USING (true);
-- Projects: all authenticated users can insert
CREATE POLICY "Users can create projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
-- Projects: all authenticated users can update
CREATE POLICY "Users can update projects" ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Projects: all authenticated users can delete
CREATE POLICY "Users can delete projects" ON projects FOR DELETE TO authenticated USING (true);

-- Members
CREATE POLICY "Users can view project members" ON project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage project members" ON project_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Milestones
CREATE POLICY "Users can view milestones" ON project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage milestones" ON project_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "Users can view tasks" ON project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tasks" ON project_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notes
CREATE POLICY "Users can view notes" ON project_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create notes" ON project_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete notes" ON project_notes FOR DELETE TO authenticated USING (true);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_projects_updated
BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_project_timestamp();

CREATE OR REPLACE TRIGGER trg_project_tasks_updated
BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_project_timestamp();
