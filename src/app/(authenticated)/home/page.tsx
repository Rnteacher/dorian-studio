import { createClient } from '@/lib/supabase/server'
import { HomePageClient } from './home-page-client'
import { getTodayQuote } from '@/lib/data/quotes'
import type { Profile, Announcement } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user profile for role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = (profileData as Profile | null)?.role
  const isAdmin = role === 'super_admin' || role === 'admin' || role === 'staff'

  // Get user's project IDs
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)
  const projectIds = (memberships ?? []).map((m) => m.project_id) as string[]

  const today = new Date().toISOString().split('T')[0]
  const nowISO = new Date().toISOString()

  // Parallel fetch all dashboard data
  const [projectsRes, tasksRes, todayEventsRes, announcementsRes, nowCountRes] = await Promise.all([
    // Active projects with client name
    projectIds.length > 0
      ? supabase
          .from('projects')
          .select('id, name, status, client_id, clients(name)')
          .in('id', projectIds)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    // User's assigned tasks (not archived)
    projectIds.length > 0
      ? supabase
          .from('tasks')
          .select('id, status, project_id')
          .in('project_id', projectIds)
          .eq('is_archived', false)
          .eq('assignee_id', user.id)
      : Promise.resolve({ data: [] }),
    // Today's events across user's projects
    projectIds.length > 0
      ? supabase
          .from('project_events')
          .select('id, title, event_date, event_time, location, project_id, projects(name)')
          .in('project_id', projectIds)
          .eq('event_date', today)
          .order('event_time', { ascending: true })
      : Promise.resolve({ data: [] }),
    // Active announcements (not expired)
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', nowISO)
      .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    // Now items count
    supabase
      .from('task_now')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const quote = getTodayQuote()

  return (
    <HomePageClient
      projects={(projectsRes.data ?? []) as unknown as Array<{
        id: string
        name: string
        status: string
        client_id: string
        clients: { name: string } | null
      }>}
      myTasks={(tasksRes.data ?? []) as unknown as Array<{
        id: string
        status: string
        project_id: string
      }>}
      todayEvents={(todayEventsRes.data ?? []) as unknown as Array<{
        id: string
        title: string
        event_date: string
        event_time: string | null
        location: string
        project_id: string
        projects: { name: string } | null
      }>}
      announcements={(announcementsRes.data ?? []) as unknown as Announcement[]}
      nowCount={nowCountRes.count ?? 0}
      quote={quote}
      isAdmin={isAdmin}
    />
  )
}
