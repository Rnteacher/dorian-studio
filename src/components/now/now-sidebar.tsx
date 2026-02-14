'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Zap } from 'lucide-react'
import { NowItem } from './now-item'
import type { NowItemWithTask } from '@/types/kanban'

interface NowSidebarProps {
  items: NowItemWithTask[]
  onRemove: (nowItemId: string) => void
}

export function NowSidebar({ items, onRemove }: NowSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'now-list',
    data: { type: 'now-list' },
  })

  return (
    <div className="w-[260px] shrink-0 border-e pe-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold">עכשיו</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <ScrollArea className="h-[calc(100vh-240px)]">
          <SortableContext
            items={items.map((i) => `now-${i.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item) => (
                <NowItem
                  key={item.id}
                  item={item}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>

          {items.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              גרור משימות לכאן
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
