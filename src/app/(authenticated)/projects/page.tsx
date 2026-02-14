import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Calendar, Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Profile, Project } from '@/types/database'

interface ProjectWithClient extends Project {
  clients: { name: string } | null
  project_members: { count: number }[]
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  const isAdmin = (profileData as Profile | null)?.role === 'admin'

  // Get user's project IDs first
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user!.id)

  const projectIds = (memberships ?? []).map(
    (m: Record<string, string>) => m.project_id
  )

  let projects: ProjectWithClient[] = []

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('*, clients ( name ), project_members ( count )')
      .in('id', projectIds)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    projects = (data ?? []) as unknown as ProjectWithClient[]
  }

  const statusLabels: Record<string, string> = {
    active: 'פעיל',
    completed: 'הושלם',
    on_hold: 'בהמתנה',
    planning: 'תכנון',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-600',
    on_hold: 'bg-amber-100 text-amber-700',
    planning: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">הפרויקטים שלי</h1>
        {isAdmin && (
          <Button size="lg" asChild className="shrink-0">
            <Link href="/admin/projects/new">
              <Plus className="size-5 me-1" />
              פרויקט חדש
            </Link>
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">אין פרויקטים עדיין.</p>
          {isAdmin && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/admin/projects/new">
                <Plus className="size-5 me-1" />
                צור פרויקט ראשון
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const memberCount = project.project_members?.[0]?.count ?? 0

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.clients?.name}
                        </p>
                      </div>
                      {project.status && statusLabels[project.status] && (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-xs ${statusColors[project.status] ?? ''}`}
                        >
                          {statusLabels[project.status]}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {memberCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {memberCount}
                        </span>
                      )}
                      {project.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(project.due_date), 'd MMM', { locale: he })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
