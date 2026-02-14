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
import { createContactAction, updateContactAction } from '@/lib/actions/contacts'
import { toast } from 'sonner'
import type { ClientContact } from '@/types/database'

interface ContactFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  contact?: ClientContact | null
}

export function ContactForm({ open, onOpenChange, clientId, contact }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!contact

  async function handleSubmit(formData: FormData) {
    try {
      if (isEdit) {
        await updateContactAction(contact!.id, clientId, formData)
        toast.success('איש הקשר עודכן')
      } else {
        await createContactAction(clientId, formData)
        toast.success('איש קשר נוסף')
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
          <DialogTitle>{isEdit ? 'עריכת איש קשר' : 'איש קשר חדש'}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">שם *</Label>
            <Input
              id="contact-name"
              name="name"
              required
              defaultValue={contact?.name ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_title">תפקיד</Label>
            <Input
              id="role_title"
              name="role_title"
              defaultValue={contact?.role_title ?? ''}
              placeholder="למשל: מנהל שיווק"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">מייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                defaultValue={contact?.email ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                dir="ltr"
                defaultValue={contact?.phone ?? ''}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-notes">הערות</Label>
            <Textarea
              id="contact-notes"
              name="notes"
              defaultValue={contact?.notes ?? ''}
              rows={2}
            />
          </div>
          <input type="hidden" name="is_primary" value={contact?.is_primary ? 'true' : 'false'} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">{isEdit ? 'שמור' : 'הוסף'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
