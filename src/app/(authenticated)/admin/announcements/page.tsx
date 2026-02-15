import { createClient } from '@/lib/supabase/server'
import { AnnouncementsPageClient } from './announcements-page-client'
import type { Announcement } from '@/types/database'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return <AnnouncementsPageClient announcements={(data ?? []) as Announcement[]} />
}
