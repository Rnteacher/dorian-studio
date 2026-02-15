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

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()

  // Verify super_admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'super_admin') {
    throw new Error('אין הרשאה — נדרש מנהל על')
  }

  // Delete client (CASCADE will handle contacts, projects have ON DELETE RESTRICT)
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) {
    if (error.message.includes('violates foreign key constraint')) {
      throw new Error('לא ניתן למחוק לקוח עם פרויקטים פעילים. ארכב את הפרויקטים תחילה.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/admin/clients')
}
