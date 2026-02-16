import { createClient } from '@/lib/supabase/server'
import { ProjectsAdminClient } from './projects-admin-client'
import type { Profile } from '@/types/database'

export default async function AdminProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [projectsResult, profileResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, is_archived, start_date, due_date, created_at, updated_at, client_id, clients ( name )')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const projects = (projectsResult.data ?? []) as unknown as Array<{
    id: string
    name: string
    status: string
    is_archived: boolean
    start_date: string | null
    due_date: string | null
    created_at: string
    updated_at: string
    client_id: string
    clients: { name: string } | null
  }>

  const role = (profileResult.data as Profile | null)?.role
  const isSuperAdmin = role === 'super_admin'

  return <ProjectsAdminClient projects={projects} isSuperAdmin={isSuperAdmin} />
}
