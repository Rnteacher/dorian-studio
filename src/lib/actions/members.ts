'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addMemberAction(projectId: string, userId: string, role: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
    })

  if (error) {
    if (error.code === '23505') throw new Error('המשתמש כבר חבר בפרויקט')
    throw new Error(error.message)
  }

  revalidatePath(`/admin/projects/${projectId}/members`)
  revalidatePath(`/projects/${projectId}`)
}

export async function removeMemberAction(projectId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${projectId}/members`)
  revalidatePath(`/projects/${projectId}`)
}

export async function updateMemberRoleAction(
  projectId: string,
  userId: string,
  role: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${projectId}/members`)
  revalidatePath(`/projects/${projectId}`)
}
