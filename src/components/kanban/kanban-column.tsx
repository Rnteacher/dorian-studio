'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants'
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
      <div className="flex items-center gap-2 mb-3 px-1">
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
        className={`flex-1 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <ScrollArea className="h-[calc(100vh-240px)]">
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

          <div className="mt-2">
            <AddTaskInline onAdd={(title) => onAddTask(status, title)} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
