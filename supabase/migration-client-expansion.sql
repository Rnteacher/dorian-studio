-- =====================================================
-- Client Management Expansion Migration
-- =====================================================
-- Adds: client_status enum, new columns on clients,
--        client_interactions table, client_feedback table
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Create client_status enum
CREATE TYPE public.client_status AS ENUM (
  'initial_contact',
  'in_evaluation',
  'active_project',
  'completed',
  'not_suitable'
);

-- 2. Add new columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status public.client_status DEFAULT 'initial_contact',
  ADD COLUMN IF NOT EXISTS brief TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget_range TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interest_areas TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referral_source TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS future_potential TEXT DEFAULT 'unknown';

-- 3. Create client_interactions table (communication history)
CREATE TABLE IF NOT EXISTS public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interaction_type TEXT NOT NULL DEFAULT 'note'
    CHECK (interaction_type IN ('meeting', 'call', 'email', 'note', 'other')),
  summary TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id
  ON public.client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_date
  ON public.client_interactions(interaction_date DESC);

-- 4. Create client_feedback table (per-project feedback)
CREATE TABLE IF NOT EXISTS public.client_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_feedback_client_id
  ON public.client_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_project_id
  ON public.client_feedback(project_id);

-- 5. RLS for client_interactions (same pattern as client_contacts)
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_interactions_select_admin" ON public.client_interactions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "client_interactions_select_member" ON public.client_interactions
  FOR SELECT USING (
    client_id IN (
      SELECT p.client_id FROM public.projects p
      WHERE p.id IN (SELECT public.user_project_ids())
    )
  );

CREATE POLICY "client_interactions_insert_admin" ON public.client_interactions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "client_interactions_update_admin" ON public.client_interactions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "client_interactions_delete_admin" ON public.client_interactions
  FOR DELETE USING (public.is_admin());

-- 6. RLS for client_feedback (same pattern)
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_feedback_select_admin" ON public.client_feedback
  FOR SELECT USING (public.is_admin());

CREATE POLICY "client_feedback_select_member" ON public.client_feedback
  FOR SELECT USING (
    client_id IN (
      SELECT p.client_id FROM public.projects p
      WHERE p.id IN (SELECT public.user_project_ids())
    )
  );

CREATE POLICY "client_feedback_insert_admin" ON public.client_feedback
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "client_feedback_update_admin" ON public.client_feedback
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "client_feedback_delete_admin" ON public.client_feedback
  FOR DELETE USING (public.is_admin());
