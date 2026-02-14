import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MembersPageClient } from './members-page-client'
import type { Profile } from '@/types/database'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function MembersPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  const { data: membersData } = await supabase
    .from('project_members')
    .select('user_id, role, profiles ( id, full_name, email, avatar_url )')
    .eq('project_id', projectId)

  const members = (membersData ?? []) as unknown as Array<{
    user_id: string
    role: string
    profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  }>

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('is_active', true)
    .order('full_name')

  const users = (allUsers ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]

  return (
    <MembersPageClient
      projectId={projectId}
      projectName={(project as { name: string }).name}
      members={members}
      allUsers={users}
    />
  )
}
