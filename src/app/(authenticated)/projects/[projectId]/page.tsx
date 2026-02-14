import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectWorkspace } from '@/components/kanban/project-workspace'
import type { Task, Project, Client, ClientContact } from '@/types/database'
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

  return (
    <ProjectWorkspace
      project={project}
      client={client}
      contacts={contacts}
      members={members}
      initialTasks={tasks}
      initialNowItems={nowItems}
    />
  )
}
