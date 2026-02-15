import { createClient } from '@/lib/supabase/server'
import { GanttChart } from '@/components/timeline/gantt-chart'
import type { Project, ProjectEvent } from '@/types/database'

interface ProjectWithEvents extends Project {
  clients: { name: string } | null
  project_events: ProjectEvent[]
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's project IDs
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user!.id)

  const projectIds = (memberships ?? []).map(
    (m: Record<string, string>) => m.project_id
  )

  let projects: ProjectWithEvents[] = []

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('*, clients ( name ), project_events ( * )')
      .in('id', projectIds)
      .eq('is_archived', false)
      .order('start_date', { ascending: true, nullsFirst: false })

    projects = (data ?? []) as unknown as ProjectWithEvents[]
  }

  const ganttProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.clients?.name ?? '',
    status: p.status,
    start_date: p.start_date,
    due_date: p.due_date,
    events: p.project_events ?? [],
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ציר זמן</h1>
      <GanttChart projects={ganttProjects} />
    </div>
  )
}
