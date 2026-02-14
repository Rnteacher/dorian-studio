'use client'

import { Button } from '@/components/ui/button'
import type { TaskFilter } from '@/types/kanban'

interface FilterToggleProps {
  value: TaskFilter
  onChange: (filter: TaskFilter) => void
}

export function FilterToggle({ value, onChange }: FilterToggleProps) {
  return (
    <div className="flex gap-1 rounded-lg border p-1">
      <Button
        variant={value === 'all' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange('all')}
      >
        כולם
      </Button>
      <Button
        variant={value === 'mine' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={() => onChange('mine')}
      >
        שלי
      </Button>
    </div>
  )
}
