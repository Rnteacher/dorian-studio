'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskStatus } from '@/types/database'

export async function createTaskAction(
  projectId: string,
  title: string,
  status: TaskStatus,
  orderIndex: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: title.trim(),
      status,
      order_index: orderIndex,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  return data
}

export async function updateTaskAction(
  taskId: string,
  projectId: string,
  updates: {
    title?: string
    description?: string
    assignee_id?: string | null
    due_date?: string | null
    status?: TaskStatus
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}

export async function moveTaskAction(
  taskId: string,
  projectId: string,
  status: TaskStatus,
  orderIndex: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status, order_index: orderIndex })
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}

export async function archiveTaskAction(
  taskId: string,
  projectId: string
) {
  const supabase = await createClient()

  // Also remove from task_now
  await supabase
    .from('task_now')
    .delete()
    .eq('task_id', taskId)

  const { error } = await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}

export async function rebalanceColumnAction(
  projectId: string,
  status: TaskStatus,
  taskIds: string[]
) {
  const supabase = await createClient()
  const gap = 1024

  const updates = taskIds.map((id, i) => ({
    id,
    order_index: (i + 1) * gap,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('tasks')
      .update({ order_index: update.order_index })
      .eq('id', update.id)

    if (error) throw new Error(error.message)
  }

  revalidatePath(`/projects/${projectId}`)
}
