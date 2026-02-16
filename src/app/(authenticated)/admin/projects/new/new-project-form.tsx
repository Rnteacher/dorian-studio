'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhaseEditor, generatePhaseId, type PhaseState } from '@/components/admin/phase-editor'
import { createProjectAction } from '@/lib/actions/projects'
import { toast } from 'sonner'
import type { Client, Profile } from '@/types/database'

interface Props {
  clients: Pick<Client, 'id' | 'name'>[]
  users: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
  defaultClientId?: string
}

export function NewProjectForm({ clients, users, defaultClientId }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(defaultClientId ?? '')
  const [phases, setPhases] = useState<PhaseState[]>([
    { id: generatePhaseId(), start_date: '', end_date: '', members: [] },
  ])

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId)
    formData.set(
      'phases',
      JSON.stringify(
        phases
          .filter((p) => p.start_date && p.end_date)
          .map(({ start_date, end_date, members }) => ({
            start_date,
            end_date,
            members: members.map(({ user_id, role }) => ({ user_id, role })),
          }))
      )
    )

    try {
      const project = await createProjectAction(formData)
      toast.success('הפרויקט נוצר בהצלחה')
      router.push(`/projects/${(project as { id: string }).id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Client */}
      <div className="space-y-2">
        <Label>לקוח *</Label>
        <Select value={clientId} onValueChange={setClientId} required>
          <SelectTrigger>
            <SelectValue placeholder="בחר לקוח" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">שם פרויקט *</Label>
        <Input id="name" name="name" required placeholder="שם הפרויקט" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">תיאור / בריף</Label>
        <Textarea id="description" name="description" rows={3} placeholder="תיאור קצר של הפרויקט" />
      </div>

      {/* Phases with teams and dates */}
      <PhaseEditor phases={phases} onPhasesChange={setPhases} users={users} />

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          ביטול
        </Button>
        <Button type="submit" disabled={!clientId}>
          צור פרויקט
        </Button>
      </div>
    </form>
  )
}
