'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
    // Use admin API to create an auth user first (profile created via handle_new_user trigger),
    // then update the profile with role and full_name
    const admin = createAdminClient()

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    })

    if (createError) throw new Error(createError.message)

    // The trigger creates the profile — now update it with role
    const { error: updateError } = await admin
      .from('profiles')
      .update({ role, full_name: fullName.trim(), is_active: true })
      .eq('id', newUser.user.id)

    if (updateError) throw new Error(updateError.message)
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
  const { user } = await requireSuperAdmin()

  // Don't allow deleting yourself
  if (profileId === user.id) {
    throw new Error('לא ניתן למחוק את עצמך')
  }

  // Use admin client to delete the auth user (profile cascades via FK)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(profileId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/team')
}
