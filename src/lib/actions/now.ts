'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addToNowAction(
  taskId: string,
  projectId: string,
  orderIndex: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  // Check if already in now list
  const { data: existing } = await supabase
    .from('task_now')
    .select('id')
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .maybeSingle()

  if (existing) return existing

  // Auto-assign if no assignee
  const { data: task } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('id', taskId)
    .single()

  if (task && !task.assignee_id) {
    await supabase
      .from('tasks')
      .update({ assignee_id: user.id })
      .eq('id', taskId)
  }

  const { data, error } = await supabase
    .from('task_now')
    .insert({
      user_id: user.id,
      task_id: taskId,
      order_index: orderIndex,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  return data
}

export async function removeFromNowAction(
  nowItemId: string,
  projectId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('task_now')
    .delete()
    .eq('id', nowItemId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}

export async function reorderNowAction(
  nowItemId: string,
  projectId: string,
  orderIndex: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('task_now')
    .update({ order_index: orderIndex })
    .eq('id', nowItemId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}
