'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { createClientAction } from '@/lib/actions/clients'
import { CLIENT_STATUS_OPTIONS } from '@/lib/constants/client'
import { toast } from 'sonner'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientForm({ open, onOpenChange }: ClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState('initial_contact')

  async function handleSubmit(formData: FormData) {
    formData.set('status', status)
    try {
      await createClientAction(formData)
      toast.success('הלקוח נוצר בהצלחה')
      onOpenChange(false)
      formRef.current?.reset()
      setStatus('initial_contact')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>לקוח חדש</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם לקוח *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="שם הלקוח או הארגון"
            />
          </div>
          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">צור לקוח</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
