'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { useUser } from '@/lib/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FolderKanban,
  CalendarDays,
  Zap,
  ListTodo,
  Megaphone,
  Quote,
  Clock,
  MapPin,
  ArrowLeft,
  Hammer,
} from 'lucide-react'
import type { Announcement } from '@/types/database'
import type { Quote as QuoteType } from '@/lib/data/quotes'

const statusLabel: Record<string, string> = {
  active: 'פעיל',
  on_hold: 'מושהה',
  completed: 'הושלם',
}

interface HomePageClientProps {
  projects: Array<{
    id: string
    name: string
    status: string
    client_id: string
    clients: { name: string } | null
  }>
  myTasks: Array<{
    id: string
    status: string
    project_id: string
  }>
  todayEvents: Array<{
    id: string
    title: string
    event_date: string
    event_time: string | null
    location: string
    project_id: string
    projects: { name: string } | null
  }>
  announcements: Announcement[]
  nowCount: number
  quote: QuoteType
  isAdmin: boolean
}

export function HomePageClient({
  projects,
  myTasks,
  todayEvents,
  announcements,
  nowCount,
  quote,
  isAdmin,
}: HomePageClientProps) {
  const { user } = useUser()

  const todoCount = myTasks.filter((t) => t.status === 'todo').length
  const doingCount = myTasks.filter((t) => t.status === 'doing').length
  const doneCount = myTasks.filter((t) => t.status === 'done').length

  const firstName = user.full_name.split(' ')[0] || user.full_name
  const todayFormatted = format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">שלום, {firstName}!</h1>
          <p className="text-muted-foreground">{todayFormatted}</p>
        </div>
      </div>

      {/* Daily Quote */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <Quote className="size-6 text-primary/60 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-medium leading-relaxed">{quote.text}</p>
              <p className="text-xs text-muted-foreground italic">{quote.original}</p>
              <p className="text-sm text-primary/80 font-medium">— {quote.author}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Card key={a.id} className="border-amber-300 bg-amber-50">
              <CardContent className="pt-4 pb-3">
                <div className="flex gap-3">
                  <Megaphone className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    {a.body && (
                      <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/projects">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FolderKanban className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">פרויקטים</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Hammer className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doingCount}</p>
                <p className="text-xs text-muted-foreground">בעבודה</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <ListTodo className="size-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todoCount}</p>
                <p className="text-xs text-muted-foreground">לביצוע</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/now">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Zap className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{nowCount}</p>
                  <p className="text-xs text-muted-foreground">עכשיו</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-Column Layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Today's Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-5 text-violet-500" />
              אירועי היום
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3">
            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                אין אירועים להיום
              </p>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-violet-100 shrink-0">
                      <Clock className="size-3.5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {event.event_time && (
                          <span>{event.event_time.slice(0, 5)}</span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="size-3" />
                            {event.location}
                          </span>
                        )}
                        {event.projects && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {event.projects.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="size-5 text-blue-500" />
              הפרויקטים שלי
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                אין פרויקטים עדיין
              </p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 6).map((project) => {
                  const projectTaskCount = myTasks.filter(
                    (t) => t.project_id === project.id && t.status === 'doing'
                  ).length

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        {project.clients && (
                          <p className="text-xs text-muted-foreground">{project.clients.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {projectTaskCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {projectTaskCount} בעבודה
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabel[project.status] ?? project.status}
                        </Badge>
                        <ArrowLeft className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })}
                {projects.length > 6 && (
                  <Link
                    href="/projects"
                    className="block text-center text-sm text-primary hover:underline pt-1"
                  >
                    הצג את כל {projects.length} הפרויקטים
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed tasks summary */}
      {doneCount > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          השלמת {doneCount} משימות — כל הכבוד! 🎉
        </p>
      )}
    </div>
  )
}
