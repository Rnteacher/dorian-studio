'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { GripVertical, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import type { Task, Profile } from '@/types/database'
import type { DragData } from '@/types/kanban'

interface TaskCardProps {
  task: Task
  members: Profile[]
  onClick: () => void
  isDragOverlay?: boolean
}

export function TaskCard({ task, members, onClick, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      container: task.status,
    } satisfies DragData,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const assignee = task.assignee_id
    ? members.find((m) => m.id === task.assignee_id)
    : null

  const initials = assignee?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) ?? ''

  return (
    <Card
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`p-3 cursor-pointer hover:border-primary/50 transition-colors group ${
        isDragOverlay ? 'shadow-lg rotate-2 border-primary' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={assignee.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}

            {task.due_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'd MMM', { locale: he })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
