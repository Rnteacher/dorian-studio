'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createAnnouncementAction, updateAnnouncementAction } from '@/lib/actions/announcements'
import { toast } from 'sonner'
import type { Announcement } from '@/types/database'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: Announcement | null
}

export function AnnouncementForm({ open, onOpenChange, announcement }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState(0)
  const [expiresAt, setExpiresAt] = useState('')

  const isEdit = !!announcement

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title)
      setBody(announcement.body)
      setPriority(announcement.priority)
      setExpiresAt(announcement.expires_at ? announcement.expires_at.split('T')[0] : '')
    } else {
      setTitle('')
      setBody('')
      setPriority(0)
      setExpiresAt('')
    }
  }, [announcement, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateAnnouncementAction(announcement.id, {
            title: title.trim(),
            body: body.trim(),
            priority,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          })
          toast.success('ההודעה עודכנה')
        } else {
          await createAnnouncementAction({
            title: title.trim(),
            body: body.trim(),
            priority,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          })
          toast.success('ההודעה נוצרה')
        }
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת הודעה' : 'הודעה חדשה'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">כותרת *</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת ההודעה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ann-body">תוכן</Label>
            <Textarea
              id="ann-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="תוכן ההודעה (אופציונלי)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ann-priority">עדיפות</Label>
              <Input
                id="ann-priority"
                type="number"
                min={0}
                max={10}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-expires">תאריך תפוגה</Label>
              <Input
                id="ann-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? 'שומר...' : isEdit ? 'עדכן' : 'צור הודעה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
