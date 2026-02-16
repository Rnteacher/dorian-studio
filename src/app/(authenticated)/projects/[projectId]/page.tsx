import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectWorkspace } from '@/components/kanban/project-workspace'
import type { Task, Project, Client, ClientContact, ProjectNote, Profile, ProjectPhase } from '@/types/database'
import type { MemberWithProfile, NowItemWithTask } from '@/types/kanban'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel
  const [projectRes, tasksRes, membersRes, nowRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*, clients(*)')
      .eq('id', projectId)
      .single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_archived', false)
      .order('order_index', { ascending: true }),
    supabase
      .from('project_members')
      .select('*, profiles(*)')
      .eq('project_id', projectId),
    supabase
      .from('task_now')
      .select('*, tasks(*)')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true }),
  ])

  // Fetch phases and notes separately (tables may not exist if migration not run yet)
  const [phasesRes, notesRes] = await Promise.all([
    supabase
      .from('project_phases')
      .select('*, project_members(user_id, role, profiles(id, full_name, avatar_url))')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .then((res) => (res.error ? { data: [] } : res)),
    supabase
      .from('project_notes')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then((res) => (res.error ? { data: [] } : res)),
  ])

  if (!projectRes.data) redirect('/projects')

  const projectWithClient = projectRes.data as unknown as Project & { clients: Client }
  const project: Project = {
    id: projectWithClient.id,
    client_id: projectWithClient.client_id,
    name: projectWithClient.name,
    description: projectWithClient.description,
    status: projectWithClient.status,
    google_drive_url: projectWithClient.google_drive_url,
    start_date: projectWithClient.start_date,
    due_date: projectWithClient.due_date,
    is_archived: projectWithClient.is_archived,
    created_at: projectWithClient.created_at,
    updated_at: projectWithClient.updated_at,
  }
  const client = projectWithClient.clients

  // Fetch contacts for the client
  const { data: contactsData } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('client_id', project.client_id)

  const contacts = (contactsData ?? []) as unknown as ClientContact[]
  const tasks = (tasksRes.data ?? []) as unknown as Task[]
  const members = (membersRes.data ?? []) as unknown as MemberWithProfile[]

  // Filter now items to only include tasks from this project
  const allNowItems = (nowRes.data ?? []) as unknown as NowItemWithTask[]
  const nowItems = allNowItems.filter(
    (item) => item.tasks?.project_id === projectId
  )

  // Process phases with lead name and member count
  const rawPhases = (phasesRes.data ?? []) as unknown as Array<
    ProjectPhase & {
      project_members: Array<{
        user_id: string
        role: string
        profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
      }>
    }
  >
  const phases = rawPhases.map((p) => {
    const lead = p.project_members.find((m) => m.role === 'lead')
    return {
      id: p.id,
      project_id: p.project_id,
      start_date: p.start_date,
      end_date: p.end_date,
      order_index: p.order_index,
      created_at: p.created_at,
      lead_name: lead?.profiles?.full_name ?? null,
      member_count: p.project_members.length,
    }
  })

  const notes = (notesRes.data ?? []) as unknown as Array<
    ProjectNote & { profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> }
  >

  return (
    <ProjectWorkspace
      project={project}
      client={client}
      contacts={contacts}
      members={members}
      initialTasks={tasks}
      initialNowItems={nowItems}
      phases={phases}
      notes={notes}
      userId={user.id}
    />
  )
}
