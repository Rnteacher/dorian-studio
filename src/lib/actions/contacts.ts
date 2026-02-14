'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createContactAction(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('שם איש קשר הוא שדה חובה')

  const { error } = await supabase.from('client_contacts').insert({
    client_id: clientId,
    name: name.trim(),
    email: (formData.get('email') as string)?.trim() ?? '',
    phone: (formData.get('phone') as string)?.trim() ?? '',
    role_title: (formData.get('role_title') as string)?.trim() ?? '',
    is_primary: formData.get('is_primary') === 'true',
    notes: (formData.get('notes') as string)?.trim() ?? '',
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${clientId}`)
}

export async function updateContactAction(
  contactId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('שם איש קשר הוא שדה חובה')

  const { error } = await supabase
    .from('client_contacts')
    .update({
      name: name.trim(),
      email: (formData.get('email') as string)?.trim() ?? '',
      phone: (formData.get('phone') as string)?.trim() ?? '',
      role_title: (formData.get('role_title') as string)?.trim() ?? '',
      is_primary: formData.get('is_primary') === 'true',
      notes: (formData.get('notes') as string)?.trim() ?? '',
    })
    .eq('id', contactId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${clientId}`)
}

export async function deleteContactAction(contactId: string, clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_contacts')
    .delete()
    .eq('id', contactId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/clients/${clientId}`)
}
