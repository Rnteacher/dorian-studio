import { createClient } from '@/lib/supabase/server'
import { TeamPageClient } from './team-page-client'
import type { Profile } from '@/types/database'

export default async function TeamPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'is', null)
    .order('created_at', { ascending: true })

  const members = (data ?? []) as Profile[]

  return <TeamPageClient members={members} />
}
