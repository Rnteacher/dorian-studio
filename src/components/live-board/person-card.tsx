'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants'
import type { Task, Profile } from '@/types/database'

interface NowTaskItem {
  task: Task
  projectName: string
}

interface PersonCardProps {
  profile: Profile
  nowTasks: NowTaskItem[]
}

export function PersonCard({ profile, nowTasks }: PersonCardProps) {
  const initials = profile.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) ?? ''

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {nowTasks.length} {nowTasks.length === 1 ? 'משימה' : 'משימות'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {nowTasks.map(({ task, projectName }) => (
            <div
              key={task.id}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
            >
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${STATUS_COLORS[task.status]}`}
              >
                {STATUS_LABELS[task.status]}
              </Badge>
              <div className="min-w-0">
                <p className="truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {projectName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
