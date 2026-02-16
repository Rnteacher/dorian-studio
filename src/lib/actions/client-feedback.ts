'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createFeedbackAction(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const content = formData.get('content') as string
  if (!content?.trim()) throw new Error('תוכן המשוב הוא שדה חובה')

  const ratingStr = formData.get('rating') as string
  const rating = ratingStr ? parseInt(ratingStr, 10) : null

  const { error } = await supabase.from('client_feedback').insert({
    client_id: clientId,
    project_id: (formData.get('project_id') as string) || null,
    content: content.trim(),
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${clientId}`)
}

export async function deleteFeedbackAction(feedbackId: string, clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_feedback')
    .delete()
    .eq('id', feedbackId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${clientId}`)
}
