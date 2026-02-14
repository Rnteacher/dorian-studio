'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addMemberAction, removeMemberAction, updateMemberRoleAction } from '@/lib/actions/members'
import { toast } from 'sonner'
import { ArrowRight, Trash2 } from 'lucide-react'
import type { Profile } from '@/types/database'

interface Member {
  user_id: string
  role: string
  profiles: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

interface Props {
  projectId: string
  projectName: string
  members: Member[]
  allUsers: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]
}

export function MembersPageClient({ projectId, projectName, members, allUsers }: Props) {
  const memberIds = members.map((m) => m.user_id)
  const availableUsers = allUsers.filter((u) => !memberIds.includes(u.id))

  async function handleAdd(userId: string) {
    try {
      await addMemberAction(projectId, userId, 'member')
      toast.success('חבר/ת צוות נוסף/ה')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`להסיר את ${name} מהפרויקט?`)) return
    try {
      await removeMemberAction(projectId, userId)
      toast.success('חבר/ת הצוות הוסר/ה')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await updateMemberRoleAction(projectId, userId, newRole)
      toast.success('התפקיד עודכן')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:underline">פרויקטים</Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>{projectName}</span>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>צוות</span>
      </div>

      <h1 className="text-2xl font-bold">צוות הפרויקט</h1>

      {/* Add member */}
      {availableUsers.length > 0 && (
        <Select onValueChange={handleAdd} value="">
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="הוסף חבר/ת צוות" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <p className="text-muted-foreground">אין חברי צוות עדיין.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {m.profiles?.full_name?.charAt(0) ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {m.profiles?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={m.role}
                  onValueChange={(val) => handleRoleChange(m.user_id, val)}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">מוביל/ה</SelectItem>
                    <SelectItem value="member">חבר/ה</SelectItem>
                    <SelectItem value="viewer">צופה</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => handleRemove(m.user_id, m.profiles?.full_name ?? '')}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drive sharing reminder */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <p className="font-medium text-amber-800">תזכורת: שיתוף Drive</p>
        <p className="text-amber-700 mt-1">
          יש לשתף את תיקיית ה-Google Drive של הפרויקט עם המיילים של חברי הצוות באופן ידני.
        </p>
      </div>
    </div>
  )
}
