-- ============================================================
-- Migration: Allow admins to delete projects
-- Run this in Supabase SQL Editor
-- ============================================================

-- RLS: Allow admin and super_admin to DELETE projects
CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (public.is_admin());

-- RLS: Allow admin and super_admin to DELETE tasks (needed for cascade)
CREATE POLICY "tasks_delete_admin" ON public.tasks
  FOR DELETE USING (public.is_admin());

-- RLS: Allow admin and super_admin to DELETE project_events
CREATE POLICY "project_events_delete_admin" ON public.project_events
  FOR DELETE USING (public.is_admin());

-- RLS: Allow admin and super_admin to DELETE project_members
CREATE POLICY "project_members_delete_admin" ON public.project_members
  FOR DELETE USING (public.is_admin());

-- RLS: Allow admin and super_admin to DELETE task_now entries for project tasks
CREATE POLICY "task_now_delete_admin" ON public.task_now
  FOR DELETE USING (public.is_admin());

-- RLS: Allow admin and super_admin to DELETE activity_log
CREATE POLICY "activity_log_delete_admin" ON public.activity_log
  FOR DELETE USING (public.is_admin());
