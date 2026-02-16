'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { updateProjectWithMembersAction } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import type { Client, Profile, Project, ProjectPhase } from '@/types/database'

interface MemberWithPhase {
  user_id: string
  role: string
  phase_id: string | null
  profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

interface PhaseWithMembers extends ProjectPhase {
  project_members: MemberWithPhase[]
}

interface Props {
  project: Project
  clients: Pick<Client, 'id' | 'name'>[]
  users: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
  currentPhases: PhaseWithMembers[]
}

const statusOptions = [
  { value: 'active', label: 'פעיל' },
  { value: 'on_hold', label: 'מושהה' },
  { value: 'completed', label: 'הושלם' },
]

export function EditProjectForm({ project, clients, users, currentPhases }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(project.client_id)
  const [status, setStatus] = useState(project.status)

  // Convert existing phases to PhaseState format
  const initialPhases: PhaseState[] = currentPhases.length > 0
    ? currentPhases.map((p) => ({
        id: generatePhaseId(),
        start_date: p.start_date,
        end_date: p.end_date,
        members: (p.project_members ?? []).map((m) => ({
          user_id: m.user_id,
          role: m.role,
          name: m.profiles?.full_name ?? 'משתמש',
        })),
      }))
    : [{ id: generatePhaseId(), start_date: project.start_date ?? '', end_date: project.due_date ?? '', members: [] }]

  const [phases, setPhases] = useState<PhaseState[]>(initialPhases)

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId)
    formData.set('status', status)
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
      await updateProjectWithMembersAction(project.id, formData)
      toast.success('הפרויקט עודכן בהצלחה')
      router.push(`/admin/clients/${clientId}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  const clientName = clients.find((c) => c.id === project.client_id)?.name ?? ''

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/clients" className="hover:underline">לקוחות</Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <Link href={`/admin/clients/${project.client_id}`} className="hover:underline">
          {clientName}
        </Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>עריכת {project.name}</span>
      </div>

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
          <Input id="name" name="name" required defaultValue={project.name} placeholder="שם הפרויקט" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">תיאור / בריף</Label>
          <Textarea id="description" name="description" rows={4} defaultValue={project.description} placeholder="תיאור קצר של הפרויקט" />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>סטטוס</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drive URL */}
        <div className="space-y-2">
          <Label htmlFor="google_drive_url">קישור Google Drive</Label>
          <Input id="google_drive_url" name="google_drive_url" type="url" dir="ltr" defaultValue={project.google_drive_url} placeholder="https://drive.google.com/..." />
        </div>

        {/* Phases with teams and dates */}
        <PhaseEditor phases={phases} onPhasesChange={setPhases} users={users} />

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={!clientId}>
            שמור שינויים
          </Button>
        </div>
      </form>
    </>
  )
}
