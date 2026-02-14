-- ============================================================
-- Dorian Studio — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ==================== ENUMS ====================

CREATE TYPE public.user_role AS ENUM ('admin', 'staff');
CREATE TYPE public.project_role AS ENUM ('lead', 'member', 'viewer');
CREATE TYPE public.task_status AS ENUM ('todo', 'doing', 'done', 'frozen');

-- ==================== HELPER FUNCTION: updated_at ====================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== PROFILES ====================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role public.user_role DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== CLIENTS ====================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_is_active ON public.clients(is_active);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== CLIENT CONTACTS ====================

CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role_title TEXT DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_contacts_client_id ON public.client_contacts(client_id);

-- ==================== PROJECTS ====================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed')),
  google_drive_url TEXT DEFAULT '',
  start_date DATE DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_is_archived ON public.projects(is_archived);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== PROJECT MEMBERS ====================

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.project_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);

-- ==================== TASKS ====================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status public.task_status NOT NULL DEFAULT 'todo',
  order_index FLOAT NOT NULL DEFAULT 0,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE DEFAULT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_project_status_order ON public.tasks(project_id, status, order_index)
  WHERE is_archived = false;
CREATE INDEX idx_tasks_is_archived ON public.tasks(is_archived);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== TASK NOW (Personal Focus List) ====================

CREATE TABLE public.task_now (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  order_index FLOAT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_task_now_user_id ON public.task_now(user_id);
CREATE INDEX idx_task_now_task_id ON public.task_now(task_id);
CREATE INDEX idx_task_now_user_order ON public.task_now(user_id, order_index);

-- ==================== PROJECT EVENTS ====================

CREATE TABLE public.project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TIME DEFAULT NULL,
  location TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_events_project_id ON public.project_events(project_id);
CREATE INDEX idx_project_events_date ON public.project_events(event_date);
CREATE INDEX idx_project_events_project_date ON public.project_events(project_id, event_date);

CREATE TRIGGER project_events_updated_at
  BEFORE UPDATE ON public.project_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== ACTIVITY LOG (Optional but recommended) ====================

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'project', 'member', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated_status', 'assigned', 'archived', etc.
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_project_id ON public.activity_log(project_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- ==================== RLS HELPER FUNCTIONS ====================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_project_lead(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND role = 'lead'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_project_ids()
RETURNS SETOF UUID AS $$
  SELECT project_id FROM public.project_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==================== ROW LEVEL SECURITY ====================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_admin" ON public.clients
  FOR SELECT USING (public.is_admin());

CREATE POLICY "clients_select_member" ON public.clients
  FOR SELECT USING (
    id IN (
      SELECT p.client_id FROM public.projects p
      WHERE p.id IN (SELECT public.user_project_ids())
    )
  );

CREATE POLICY "clients_insert_admin" ON public.clients
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "clients_update_admin" ON public.clients
  FOR UPDATE USING (public.is_admin());

-- CLIENT CONTACTS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contacts_select_admin" ON public.client_contacts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "client_contacts_select_member" ON public.client_contacts
  FOR SELECT USING (
    client_id IN (
      SELECT p.client_id FROM public.projects p
      WHERE p.id IN (SELECT public.user_project_ids())
    )
  );

CREATE POLICY "client_contacts_insert_admin" ON public.client_contacts
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "client_contacts_update_admin" ON public.client_contacts
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "client_contacts_delete_admin" ON public.client_contacts
  FOR DELETE USING (public.is_admin());

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.is_admin() OR public.is_project_member(id)
  );

CREATE POLICY "projects_insert_admin" ON public.projects
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    public.is_admin() OR public.is_project_lead(id)
  );

-- PROJECT MEMBERS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (
    public.is_admin()
    OR project_id IN (SELECT public.user_project_ids())
  );

CREATE POLICY "project_members_insert" ON public.project_members
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_project_lead(project_id)
  );

CREATE POLICY "project_members_update" ON public.project_members
  FOR UPDATE USING (
    public.is_admin() OR public.is_project_lead(project_id)
  );

CREATE POLICY "project_members_delete" ON public.project_members
  FOR DELETE USING (
    public.is_admin() OR public.is_project_lead(project_id)
  );

-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    public.is_admin() OR public.is_project_member(project_id)
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_project_member(project_id)
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    public.is_admin() OR public.is_project_member(project_id)
  );

-- TASK NOW
ALTER TABLE public.task_now ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_now_select_own" ON public.task_now
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "task_now_select_shared" ON public.task_now
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_now.task_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "task_now_insert_own" ON public.task_now
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "task_now_update_own" ON public.task_now
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "task_now_delete_own" ON public.task_now
  FOR DELETE USING (user_id = auth.uid());

-- PROJECT EVENTS
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_events_select" ON public.project_events
  FOR SELECT USING (
    public.is_admin() OR public.is_project_member(project_id)
  );

CREATE POLICY "project_events_insert" ON public.project_events
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_project_lead(project_id)
  );

CREATE POLICY "project_events_update" ON public.project_events
  FOR UPDATE USING (
    public.is_admin() OR public.is_project_lead(project_id)
  );

CREATE POLICY "project_events_delete" ON public.project_events
  FOR DELETE USING (
    public.is_admin() OR public.is_project_lead(project_id)
  );

-- ACTIVITY LOG
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT USING (
    public.is_admin()
    OR (project_id IS NOT NULL AND public.is_project_member(project_id))
  );

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ==================== REALTIME ====================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_now;
