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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createProjectAction } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { Client, Profile } from '@/types/database'

interface Props {
  clients: Pick<Client, 'id' | 'name'>[]
  users: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
  defaultClientId?: string
}

interface MemberSelection {
  user_id: string
  role: string
  name: string
}

export function NewProjectForm({ clients, users, defaultClientId }: Props) {
  const router = useRouter()
  const [clientId, setClientId] = useState(defaultClientId ?? '')
  const [members, setMembers] = useState<MemberSelection[]>([])

  function addMember(userId: string) {
    if (members.some((m) => m.user_id === userId)) return
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setMembers([...members, {
      user_id: userId,
      role: members.length === 0 ? 'lead' : 'member',
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
    formData.set(
      'members',
      JSON.stringify(members.map(({ user_id, role }) => ({ user_id, role })))
    )

    try {
      const project = await createProjectAction(formData)
      toast.success('הפרויקט נוצר בהצלחה')
      router.push(`/projects/${(project as { id: string }).id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  const availableUsers = users.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  )

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

      {/* Drive URL */}
      <div className="space-y-2">
        <Label htmlFor="google_drive_url">קישור Google Drive</Label>
        <Input
          id="google_drive_url"
          name="google_drive_url"
          type="url"
          dir="ltr"
          placeholder="https://drive.google.com/..."
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">תאריך התחלה</Label>
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">דדליין</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>
      </div>

      {/* Team */}
      <div className="space-y-3">
        <Label>צוות</Label>

        {/* Add member */}
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
          צור פרויקט
        </Button>
      </div>
    </form>
  )
}
