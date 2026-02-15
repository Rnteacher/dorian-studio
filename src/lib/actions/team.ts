'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/database'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as Profile | null)?.role !== 'super_admin') {
    throw new Error('אין הרשאה — נדרש מנהל על')
  }

  return { supabase, user }
}

export async function listTeamAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Profile[]
}

export async function addTeamMemberAction(
  email: string,
  fullName: string,
  role: UserRole
) {
  const { supabase } = await requireSuperAdmin()

  if (!email?.trim()) throw new Error('אימייל הוא שדה חובה')
  if (!fullName?.trim()) throw new Error('שם מלא הוא שדה חובה')

  // Check if profile with this email already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email.trim())
    .maybeSingle()

  if (existing) {
    // If profile exists but has no role, update it
    if (!(existing as Profile).role) {
      const { error } = await supabase
        .from('profiles')
        .update({ role, full_name: fullName.trim(), is_active: true })
        .eq('id', (existing as Profile).id)

      if (error) throw new Error(error.message)
    } else {
      throw new Error('משתמש עם אימייל זה כבר קיים במערכת')
    }
  } else {
    // Create a pre-registered profile with a random UUID
    // When the user signs in via Google, handle_new_user trigger will update the id
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        is_active: true,
      })

    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/team')
}

export async function updateTeamMemberRoleAction(
  profileId: string,
  role: UserRole
) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/team')
}

export async function deactivateTeamMemberAction(profileId: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', profileId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/team')
}

export async function activateTeamMemberAction(profileId: string) {
  const { supabase } = await requireSuperAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', profileId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/team')
}

export async function deleteTeamMemberAction(profileId: string) {
  const { supabase, user } = await requireSuperAdmin()

  // Don't allow deleting yourself
  if (profileId === user.id) {
    throw new Error('לא ניתן למחוק את עצמך')
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/team')
}
