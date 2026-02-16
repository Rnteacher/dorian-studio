'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight } from 'lucide-react'
import { updateClientAction } from '@/lib/actions/clients'
import { CLIENT_STATUS_OPTIONS, FUTURE_POTENTIAL_OPTIONS } from '@/lib/constants/client'
import { toast } from 'sonner'
import type { Client } from '@/types/database'

interface Props {
  client: Client
}

export function EditClientForm({ client }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<string>(client.status || 'initial_contact')
  const [isPaid, setIsPaid] = useState<string>(client.is_paid ? 'true' : 'false')
  const [futurePotential, setFuturePotential] = useState<string>(client.future_potential || 'unknown')

  async function handleSubmit(formData: FormData) {
    formData.set('status', status)
    formData.set('is_paid', isPaid)
    formData.set('future_potential', futurePotential)

    try {
      await updateClientAction(client.id, formData)
      toast.success('הלקוח עודכן בהצלחה')
      router.push(`/admin/clients/${client.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/clients" className="hover:underline">
          לקוחות
        </Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <Link href={`/admin/clients/${client.id}`} className="hover:underline">
          {client.name}
        </Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>עריכה</span>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">פרטים בסיסיים</h2>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">שם לקוח *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={client.name}
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

          <div className="space-y-2">
            <Label htmlFor="brief">בריף לקוח</Label>
            <Textarea
              id="brief"
              name="brief"
              defaultValue={client.brief}
              placeholder="תיאור מפורט של הלקוח, צרכיו ודרישותיו..."
              rows={6}
            />
          </div>
        </section>

        {/* Section 2: Budget & Pricing */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">תקציב ותמחור</h2>
          <Separator />

          <div className="space-y-2">
            <Label>סוג עבודה</Label>
            <Select value={isPaid} onValueChange={setIsPaid}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">התנדבותי</SelectItem>
                <SelectItem value="true">בתשלום</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_range">טווח תקציב</Label>
            <Input
              id="budget_range"
              name="budget_range"
              defaultValue={client.budget_range}
              placeholder='לדוגמה: 5,000-10,000 ₪'
              dir="ltr"
              className="text-start"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">תנאי תשלום</Label>
            <Textarea
              id="payment_terms"
              name="payment_terms"
              defaultValue={client.payment_terms}
              placeholder="פירוט תנאי תשלום, לוחות זמנים..."
              rows={3}
            />
          </div>
        </section>

        {/* Section 3: Professional Details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">פרטים מקצועיים</h2>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="referral_source">מקור הפניה</Label>
            <Input
              id="referral_source"
              name="referral_source"
              defaultValue={client.referral_source}
              placeholder="איך הלקוח הגיע אלינו? (המלצה, אתר, רשתות...)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest_areas">תחומי עניין</Label>
            <Textarea
              id="interest_areas"
              name="interest_areas"
              defaultValue={client.interest_areas}
              placeholder="איזה סוגי פרויקטים מעניינים את הלקוח..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>פוטנציאל לעבודה עתידית</Label>
            <Select value={futurePotential} onValueChange={setFuturePotential}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUTURE_POTENTIAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Section 4: Internal Notes */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">הערות פנימיות</h2>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client.notes}
              placeholder="הערות פנימיות על הלקוח..."
              rows={4}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/clients/${client.id}`}>ביטול</Link>
          </Button>
          <Button type="submit">שמור שינויים</Button>
        </div>
      </form>
    </>
  )
}
