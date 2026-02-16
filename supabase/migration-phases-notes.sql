-- ============================================
-- Migration: Project Phases + Project Notes
-- ============================================

-- 1. Create project_phases table
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON public.project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_dates ON public.project_phases(start_date, end_date);

-- 2. Add phase_id to project_members (nullable for backward compat)
ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.project_phases(id) ON DELETE CASCADE;

-- 3. Drop the old unique constraint and create a new one that includes phase_id
-- First check if old constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_members_project_id_user_id_key'
  ) THEN
    ALTER TABLE public.project_members
      DROP CONSTRAINT project_members_project_id_user_id_key;
  END IF;
END $$;

-- Create new unique constraint: same user can be in multiple phases of the same project
ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_project_user_phase_key
  UNIQUE (project_id, user_id, phase_id);

-- 4. Migrate existing data: create a default phase for each project that has members
-- Use the project's start_date/due_date, or reasonable defaults
INSERT INTO public.project_phases (id, project_id, start_date, end_date, order_index)
SELECT
  gen_random_uuid(),
  p.id,
  COALESCE(p.start_date, p.created_at::date),
  COALESCE(p.due_date, (p.created_at + interval '1 year')::date),
  0
FROM public.projects p
WHERE EXISTS (
  SELECT 1 FROM public.project_members pm
  WHERE pm.project_id = p.id AND pm.phase_id IS NULL
);

-- Link existing members to their project's newly created phase
UPDATE public.project_members pm
SET phase_id = ph.id
FROM public.project_phases ph
WHERE pm.project_id = ph.project_id
  AND pm.phase_id IS NULL;

-- 5. Create project_notes table
CREATE TABLE IF NOT EXISTS public.project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_user_id ON public.project_notes(user_id);

-- 6. RLS for project_phases
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_phases_select" ON public.project_phases
  FOR SELECT USING (
    public.is_admin()
    OR project_id IN (SELECT public.user_project_ids())
  );

CREATE POLICY "project_phases_insert" ON public.project_phases
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "project_phases_update" ON public.project_phases
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "project_phases_delete" ON public.project_phases
  FOR DELETE USING (public.is_admin());

-- 7. RLS for project_notes
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- SELECT: shared notes visible to project members, private notes only to author
CREATE POLICY "project_notes_select" ON public.project_notes
  FOR SELECT USING (
    public.is_admin()
    OR (
      project_id IN (SELECT public.user_project_ids())
      AND (is_private = false OR user_id = auth.uid())
    )
  );

-- INSERT: project members can add notes
CREATE POLICY "project_notes_insert" ON public.project_notes
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR project_id IN (SELECT public.user_project_ids())
  );

-- DELETE: only your own notes, or admin
CREATE POLICY "project_notes_delete" ON public.project_notes
  FOR DELETE USING (
    public.is_admin()
    OR user_id = auth.uid()
  );
