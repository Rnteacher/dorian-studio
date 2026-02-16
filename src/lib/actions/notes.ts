'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createNoteAction(
  projectId: string,
  content: string,
  isPrivate: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  if (!content.trim()) throw new Error('תוכן ההערה ריק')

  const { error } = await supabase
    .from('project_notes')
    .insert({
      project_id: projectId,
      user_id: user.id,
      content: content.trim(),
      is_private: isPrivate,
    })

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteNoteAction(noteId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
}
