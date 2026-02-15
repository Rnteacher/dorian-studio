-- ============================================================
-- Migration: Add super_admin role + team management support
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add 'super_admin' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Update is_admin() to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. New function: is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. RLS: Allow super_admin to DELETE clients
CREATE POLICY "clients_delete_super_admin" ON public.clients
  FOR DELETE USING (public.is_super_admin());

-- 5. RLS: Allow super_admin to INSERT profiles (add team members)
CREATE POLICY "profiles_insert_super_admin" ON public.profiles
  FOR INSERT WITH CHECK (public.is_super_admin());

-- 6. RLS: Allow super_admin to DELETE profiles (remove team members)
CREATE POLICY "profiles_delete_super_admin" ON public.profiles
  FOR DELETE USING (public.is_super_admin());

-- 7. Update handle_new_user trigger:
--    If a profile with matching email already exists (pre-created by super_admin),
--    update it with the auth user id + avatar instead of creating a new one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_profile_id UUID;
BEGIN
  -- Check if a profile was pre-created for this email
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_profile_id IS NOT NULL THEN
    -- Update existing pre-created profile with auth user id and avatar
    UPDATE public.profiles
    SET
      id = NEW.id,
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', avatar_url),
      full_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), full_name)
    WHERE id = existing_profile_id;
  ELSE
    -- No pre-created profile: create new one (but with role=NULL = no access)
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update current user to super_admin
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'ronen@chamama.org';
