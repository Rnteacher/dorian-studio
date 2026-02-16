'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createFeedbackAction } from '@/lib/actions/client-feedback'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectOption {
  id: string
  name: string
}

interface Props {
  clientId: string
  projects: ProjectOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackForm({ clientId, projects, open, onOpenChange }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [projectId, setProjectId] = useState('')
  const [rating, setRating] = useState(0)

  async function handleSubmit(formData: FormData) {
    if (projectId) formData.set('project_id', projectId)
    if (rating > 0) formData.set('rating', String(rating))

    try {
      await createFeedbackAction(clientId, formData)
      toast.success('המשוב נוסף')
      onOpenChange(false)
      formRef.current?.reset()
      setProjectId('')
      setRating(0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת משוב</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>פרויקט</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">תוכן המשוב *</Label>
            <Textarea
              id="content"
              name="content"
              required
              placeholder="משוב מהלקוח על הפרויקט / העבודה..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>דירוג</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`size-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground ms-2 self-center">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">הוסף משוב</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
