import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProjectForm } from './edit-project-form'
import type { Client, Profile, Project, ProjectPhase } from '@/types/database'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()

  // Fetch project, clients, users in parallel
  const [projectResult, clientsResult, usersResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single(),
    supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('is_active', true)
      .not('role', 'is', null)
      .order('full_name'),
  ])

  // Fetch phases separately (table may not exist if migration not run yet)
  const phasesResult = await supabase
    .from('project_phases')
    .select('*, project_members ( user_id, role, phase_id, profiles ( id, full_name, email, avatar_url ) )')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .then((res) => (res.error ? { data: [] } : res))

  if (!projectResult.data) notFound()

  const project = projectResult.data as unknown as Project
  const clients = (clientsResult.data ?? []) as Pick<Client, 'id' | 'name'>[]
  const users = (usersResult.data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
  const phases = (phasesResult.data ?? []) as unknown as Array<ProjectPhase & {
    project_members: Array<{
      user_id: string
      role: string
      phase_id: string | null
      profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
    }>
  }>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">עריכת פרויקט</h1>
      <EditProjectForm
        project={project}
        clients={clients}
        users={users}
        currentPhases={phases}
      />
    </div>
  )
}
