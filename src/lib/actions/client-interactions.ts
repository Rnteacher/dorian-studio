'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createInteractionAction(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const summary = formData.get('summary') as string
  if (!summary?.trim()) throw new Error('תקציר הוא שדה חובה')

  const { error } = await supabase.from('client_interactions').insert({
    client_id: clientId,
    interaction_date: (formData.get('interaction_date') as string) || new Date().toISOString().split('T')[0],
    interaction_type: (formData.get('interaction_type') as string) || 'note',
    summary: summary.trim(),
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${clientId}`)
}

export async function deleteInteractionAction(interactionId: string, clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_interactions')
    .delete()
    .eq('id', interactionId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/clients/${clientId}`)
}
