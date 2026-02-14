import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectCalendar } from '@/components/calendar/project-calendar'
import type { ProjectEvent, Project } from '@/types/database'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function CalendarPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch project and events in parallel
  const [projectRes, eventsRes, memberRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_events')
      .select('*')
      .eq('project_id', projectId)
      .order('event_date', { ascending: true }),
    supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single(),
  ])

  if (!projectRes.data) redirect('/projects')

  const project = projectRes.data as unknown as Project
  const events = (eventsRes.data ?? []) as unknown as ProjectEvent[]

  // Check if user is admin or project lead
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'
  const isLead = memberRes.data?.role === 'lead'
  const canEdit = isAdmin || isLead

  return (
    <ProjectCalendar
      project={project}
      initialEvents={events}
      canEdit={canEdit}
    />
  )
}
