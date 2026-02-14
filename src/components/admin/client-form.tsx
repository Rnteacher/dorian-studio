'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import { toast } from 'sonner'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: { id: string; name: string; notes: string } | null
}

export function ClientForm({ open, onOpenChange, client }: ClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!client

  async function handleSubmit(formData: FormData) {
    try {
      if (isEdit) {
        await updateClientAction(client!.id, formData)
        toast.success('הלקוח עודכן בהצלחה')
      } else {
        await createClientAction(formData)
        toast.success('הלקוח נוצר בהצלחה')
      }
      onOpenChange(false)
      formRef.current?.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם לקוח *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={client?.name ?? ''}
              placeholder="שם הלקוח"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes ?? ''}
              placeholder="הערות על הלקוח"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">{isEdit ? 'שמור' : 'צור לקוח'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
