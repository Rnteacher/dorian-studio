'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as Profile | null)?.role
  if (!role || !['super_admin', 'admin', 'staff'].includes(role)) {
    throw new Error('אין הרשאה')
  }

  return { supabase, user }
}

export async function createAnnouncementAction(data: {
  title: string
  body?: string
  priority?: number
  expires_at?: string | null
}) {
  const { supabase, user } = await requireAdmin()
  if (!data.title?.trim()) throw new Error('כותרת היא שדה חובה')

  const { error } = await supabase.from('announcements').insert({
    title: data.title.trim(),
    body: data.body?.trim() ?? '',
    priority: data.priority ?? 0,
    expires_at: data.expires_at ?? null,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/home')
}

export async function updateAnnouncementAction(
  id: string,
  data: {
    title?: string
    body?: string
    is_active?: boolean
    priority?: number
    expires_at?: string | null
  }
) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('announcements')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/home')
}

export async function deleteAnnouncementAction(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/announcements')
  revalidatePath('/home')
}
