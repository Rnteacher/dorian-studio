'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import type { ProjectEvent } from '@/types/database'

interface EventFormProps {
  event: ProjectEvent | null
  defaultDate?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    title: string
    description: string
    event_date: string
    event_time: string
    location: string
  }) => void
  onDelete?: (eventId: string) => void
  canEdit: boolean
}

export function EventForm({
  event,
  defaultDate,
  open,
  onOpenChange,
  onSave,
  onDelete,
  canEdit,
}: EventFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')

  // Sync state when event changes
  const [prevEventId, setPrevEventId] = useState<string | null>(null)
  if (event && event.id !== prevEventId) {
    setPrevEventId(event.id)
    setTitle(event.title)
    setDescription(event.description ?? '')
    setEventDate(event.event_date)
    setEventTime(event.event_time ?? '')
    setLocation(event.location ?? '')
  } else if (!event && prevEventId !== 'new') {
    setPrevEventId('new')
    setTitle('')
    setDescription('')
    setEventDate(defaultDate ?? '')
    setEventTime('')
    setLocation('')
  }

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description,
      event_date: eventDate,
      event_time: eventTime,
      location,
    })
    onOpenChange(false)
  }

  const isNew = !event
  const dialogTitle = isNew ? 'אירוע חדש' : canEdit ? 'עריכת אירוע' : 'פרטי אירוע'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={!canEdit}
              placeholder="שם האירוע"
            />
          </div>

          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              readOnly={!canEdit}
              rows={2}
              placeholder="תיאור..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                readOnly={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>שעה</Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                readOnly={!canEdit}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>מיקום</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              readOnly={!canEdit}
              placeholder="מיקום האירוע"
            />
          </div>

          {canEdit && (
            <div className="flex items-center justify-between pt-2">
              {event && onDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    onDelete(event.id)
                    onOpenChange(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 me-1" />
                  מחק
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  ביטול
                </Button>
                <Button onClick={handleSave} disabled={!title.trim() || !eventDate}>
                  שמור
                </Button>
              </div>
            </div>
          )}

          {!canEdit && (
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                סגור
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
