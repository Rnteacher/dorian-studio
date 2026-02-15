-- ============================================================
-- Migration: Add announcements table for system-wide messages
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON public.announcements(is_active);
CREATE INDEX idx_announcements_dates ON public.announcements(starts_at, expires_at);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone with a role can read active announcements
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (true);

-- Only admins can create/update/delete
CREATE POLICY "announcements_insert_admin" ON public.announcements
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "announcements_update_admin" ON public.announcements
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "announcements_delete_admin" ON public.announcements
  FOR DELETE USING (public.is_admin());
