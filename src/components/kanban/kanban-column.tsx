'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS, STATUS_HEADER_COLORS, STATUS_BG_COLORS } from '@/lib/utils/constants'
import { TaskCard } from './task-card'
import { AddTaskInline } from './add-task-inline'
import type { Task, TaskStatus, Profile } from '@/types/database'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  members: Profile[]
  onAddTask: (status: TaskStatus, title: string) => void
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({
  status,
  tasks,
  members,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  })

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      {/* Colored header bar */}
      <div className={`h-1.5 rounded-t-lg ${STATUS_HEADER_COLORS[status]}`} />

      <div className={`flex items-center gap-2 px-3 py-2 border-x ${STATUS_BG_COLORS[status]}`}>
        <Badge
          variant="secondary"
          className={STATUS_COLORS[status]}
        >
          {STATUS_LABELS[status]}
        </Badge>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg border p-2 transition-colors ${STATUS_BG_COLORS[status]} ${
          isOver ? 'ring-2 ring-primary ring-offset-1' : ''
        }`}
      >
        <ScrollArea className="h-[calc(100vh-260px)]">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </SortableContext>

          {status === 'todo' && (
            <div className="mt-2">
              <AddTaskInline onAdd={(title) => onAddTask(status, title)} />
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
