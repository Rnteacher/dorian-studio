'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { createInteractionAction } from '@/lib/actions/client-interactions'
import { INTERACTION_TYPE_OPTIONS } from '@/lib/constants/client'
import { toast } from 'sonner'

interface Props {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InteractionForm({ clientId, open, onOpenChange }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [type, setType] = useState('note')

  async function handleSubmit(formData: FormData) {
    formData.set('interaction_type', type)
    try {
      await createInteractionAction(clientId, formData)
      toast.success('האינטראקציה נוספה')
      onOpenChange(false)
      formRef.current?.reset()
      setType('note')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>תיעוד אינטראקציה</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interaction_date">תאריך</Label>
              <Input
                id="interaction_date"
                name="interaction_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">תקציר *</Label>
            <Textarea
              id="summary"
              name="summary"
              required
              placeholder="תיאור קצר של האינטראקציה..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">הוסף</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
