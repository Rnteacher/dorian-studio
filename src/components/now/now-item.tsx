'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/utils/constants'
import type { NowItemWithTask } from '@/types/kanban'

interface NowItemProps {
  item: NowItemWithTask
  onRemove: (nowItemId: string) => void
  isDragOverlay?: boolean
}

export function NowItem({ item, onRemove, isDragOverlay }: NowItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `now-${item.id}`,
    data: {
      type: 'task',
      task: item.tasks,
      container: 'now-list' as const,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card text-sm group ${
        isDragOverlay ? 'shadow-lg rotate-1 border-primary' : ''
      }`}
    >
      <button
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="truncate">{item.tasks.title}</p>
      </div>

      <Badge
        variant="secondary"
        className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[item.tasks.status]}`}
      >
        {STATUS_LABELS[item.tasks.status]}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0"
        onClick={() => onRemove(item.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
