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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { updateProjectWithMembersAction } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { ArrowRight, X } from 'lucide-react'
import type { Client, Profile, Project } from '@/types/database'

interface MemberWithProfile {
  user_id: string
  role: string
  profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

interface Props {
  project: Project
  clients: Pick<Client, 'id' | 'name'>[]
  users: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
  currentMembers: MemberWithProfile[]
}

interface MemberSelection {
  user_id: string
  role: string
  name: string
}

const statusOptions = [
  { value: 'active', label: 'פעיל' },
  { value: 'on_hold', label: 'מושהה' },
  { value: 'completed', label: 'הושלם' },
]

export function EditProjectForm({ project, clients, users, currentMembers }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(project.client_id)
  const [status, setStatus] = useState(project.status)
  const [members, setMembers] = useState<MemberSelection[]>(
    currentMembers.map((m) => ({
      user_id: m.user_id,
      role: m.role,
      name: m.profiles?.full_name ?? 'משתמש',
    }))
  )

  function addMember(userId: string) {
    if (members.some((m) => m.user_id === userId)) return
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setMembers([...members, {
      user_id: userId,
      role: 'member',
      name: user.full_name,
    }])
  }

  function removeMember(userId: string) {
    setMembers(members.filter((m) => m.user_id !== userId))
  }

  function toggleRole(userId: string) {
    setMembers(
      members.map((m) =>
        m.user_id === userId
          ? { ...m, role: m.role === 'lead' ? 'member' : 'lead' }
          : m
      )
    )
  }

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId)
    formData.set('status', status)
    formData.set(
      'members',
      JSON.stringify(members.map(({ user_id, role }) => ({ user_id, role })))
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

  const availableUsers = users.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  )

  // Find client name for breadcrumb
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
          <Input
            id="name"
            name="name"
            required
            defaultValue={project.name}
            placeholder="שם הפרויקט"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">תיאור / בריף</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={project.description}
            placeholder="תיאור קצר של הפרויקט"
          />
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
          <Input
            id="google_drive_url"
            name="google_drive_url"
            type="url"
            dir="ltr"
            defaultValue={project.google_drive_url}
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">תאריך התחלה</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={project.start_date ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">דדליין</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              defaultValue={project.due_date ?? ''}
            />
          </div>
        </div>

        {/* Team */}
        <div className="space-y-3">
          <Label>צוות</Label>

          {/* Add member */}
          {availableUsers.length > 0 && (
            <Select onValueChange={addMember} value="">
              <SelectTrigger>
                <SelectValue placeholder="הוסף חבר/ת צוות" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {u.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {u.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Selected members */}
          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between rounded-lg border p-2 pe-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.name}</span>
                    <Badge
                      variant={m.role === 'lead' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleRole(m.user_id)}
                    >
                      {m.role === 'lead' ? 'מוביל/ה' : 'חבר/ה'}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={() => removeMember(m.user_id)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                לחץ על התג כדי להחליף בין מוביל/ה לחבר/ה
              </p>
            </div>
          )}
        </div>

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
