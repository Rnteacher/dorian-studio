import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LiveBoardView } from '@/components/live-board/live-board-view'
import type { Task, Profile } from '@/types/database'

interface NowRow {
  user_id: string
  task_id: string
  order_index: number
  tasks: Task & { projects: { name: string } }
  profiles: Profile
}

export default async function LiveBoardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all projects the current user is a member of
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const projectIds = (memberships ?? []).map((m) => m.project_id) as string[]

  if (projectIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">לוח חי</h1>
        <LiveBoardView people={[]} />
      </div>
    )
  }

  // Get all team members from those projects
  const { data: allMembers } = await supabase
    .from('project_members')
    .select('user_id')
    .in('project_id', projectIds)

  const teamUserIds = [...new Set((allMembers ?? []).map((m) => m.user_id))] as string[]

  // Get all task_now entries for these team members, with task + project info + profile
  const { data: nowData } = await supabase
    .from('task_now')
    .select('user_id, task_id, order_index, tasks(*, projects(name)), profiles(*)')
    .in('user_id', teamUserIds)
    .order('order_index', { ascending: true })

  const nowRows = (nowData ?? []) as unknown as NowRow[]

  // Group by person
  const peopleMap = new Map<string, {
    profile: Profile
    nowTasks: { task: Task; projectName: string }[]
  }>()

  for (const row of nowRows) {
    if (!row.profiles || !row.tasks) continue

    if (!peopleMap.has(row.user_id)) {
      peopleMap.set(row.user_id, {
        profile: row.profiles,
        nowTasks: [],
      })
    }

    peopleMap.get(row.user_id)!.nowTasks.push({
      task: row.tasks,
      projectName: row.tasks.projects?.name ?? '',
    })
  }

  const people = Array.from(peopleMap.values())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">לוח חי</h1>
        <p className="text-muted-foreground text-sm mt-1">מי עובד על מה עכשיו</p>
      </div>
      <LiveBoardView people={people} />
    </div>
  )
}
