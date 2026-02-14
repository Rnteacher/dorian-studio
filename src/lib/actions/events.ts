'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createEventAction(
  projectId: string,
  data: {
    title: string
    description?: string
    event_date: string
    event_time?: string
    location?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  if (!data.title?.trim()) throw new Error('כותרת היא שדה חובה')
  if (!data.event_date) throw new Error('תאריך הוא שדה חובה')

  const { data: result, error } = await supabase
    .from('project_events')
    .insert({
      project_id: projectId,
      title: data.title.trim(),
      description: data.description?.trim() ?? '',
      event_date: data.event_date,
      event_time: data.event_time || null,
      location: data.location?.trim() ?? '',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}/calendar`)
  return result
}

export async function updateEventAction(
  eventId: string,
  projectId: string,
  data: {
    title?: string
    description?: string
    event_date?: string
    event_time?: string | null
    location?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_events')
    .update(data)
    .eq('id', eventId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}/calendar`)
}

export async function deleteEventAction(
  eventId: string,
  projectId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_events')
    .delete()
    .eq('id', eventId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}/calendar`)
}
