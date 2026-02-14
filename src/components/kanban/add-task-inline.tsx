'use client'

import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddTaskInlineProps {
  onAdd: (title: string) => void
}

export function AddTaskInline({ onAdd }: AddTaskInlineProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!title.trim()) {
      setIsAdding(false)
      return
    }
    onAdd(title.trim())
    setTitle('')
    inputRef.current?.focus()
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => {
          setIsAdding(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        <Plus className="h-4 w-4 me-1" />
        משימה חדשה
      </Button>
    )
  }

  return (
    <div className="px-1">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="כותרת המשימה..."
        className="text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') {
            setIsAdding(false)
            setTitle('')
          }
        }}
        onBlur={handleSubmit}
      />
    </div>
  )
}
