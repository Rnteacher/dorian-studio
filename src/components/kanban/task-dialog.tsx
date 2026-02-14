'use client'

import { useState } from 'react'
import { Archive } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, KANBAN_COLUMNS } from '@/lib/utils/constants'
import type { Task, Profile, TaskStatus } from '@/types/database'

interface TaskDialogProps {
  task: Task | null
  members: Profile[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (taskId: string, updates: {
    title?: string
    description?: string
    assignee_id?: string | null
    due_date?: string | null
    status?: TaskStatus
  }) => void
  onArchive: (taskId: string) => void
}

export function TaskDialog({
  task,
  members,
  open,
  onOpenChange,
  onSave,
  onArchive,
}: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('__none__')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')

  // Sync state when task changes
  const [prevTaskId, setPrevTaskId] = useState<string | null>(null)
  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description ?? '')
    setAssigneeId(task.assignee_id ?? '__none__')
    setDueDate(task.due_date ?? '')
    setStatus(task.status)
  }

  if (!task) return null

  function handleSave() {
    if (!task) return
    onSave(task.id, {
      title: title.trim() || task.title,
      description,
      assignee_id: assigneeId === '__none__' ? null : assigneeId,
      due_date: dueDate || null,
      status,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת משימה</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="תיאור המשימה..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>מבצע</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="ללא" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ללא</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUMNS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>תאריך יעד</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onArchive(task.id)
                onOpenChange(false)
              }}
            >
              <Archive className="h-4 w-4 me-1" />
              ארכוב
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button onClick={handleSave}>
                שמור
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
