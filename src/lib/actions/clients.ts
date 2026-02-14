'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const notes = formData.get('notes') as string

  if (!name?.trim()) throw new Error('שם לקוח הוא שדה חובה')

  const { data, error } = await supabase
    .from('clients')
    .insert({ name: name.trim(), notes: notes?.trim() ?? '' })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
  return data
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const notes = formData.get('notes') as string

  if (!name?.trim()) throw new Error('שם לקוח הוא שדה חובה')

  const { error } = await supabase
    .from('clients')
    .update({ name: name.trim(), notes: notes?.trim() ?? '' })
    .eq('id', clientId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${clientId}`)
}

export async function toggleClientActiveAction(clientId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ is_active: isActive })
    .eq('id', clientId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${clientId}`)
}
