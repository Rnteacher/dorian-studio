'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TeamMemberForm } from '@/components/admin/team-member-form'
import { useUser } from '@/lib/hooks/use-user'
import { ROLE_LABELS } from '@/lib/utils/constants'
import {
  updateTeamMemberRoleAction,
  deactivateTeamMemberAction,
  activateTeamMemberAction,
  deleteTeamMemberAction,
} from '@/lib/actions/team'
import { Plus, Trash2, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types/database'

interface TeamPageClientProps {
  members: Profile[]
}

export function TeamPageClient({ members }: TeamPageClientProps) {
  const { user, isSuperAdmin } = useUser()
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(profileId: string, newRole: UserRole) {
    startTransition(async () => {
      try {
        await updateTeamMemberRoleAction(profileId, newRole)
        router.refresh()
        toast.success('התפקיד עודכן')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleToggleActive(profile: Profile) {
    startTransition(async () => {
      try {
        if (profile.is_active) {
          await deactivateTeamMemberAction(profile.id)
          toast.success('המשתמש הושבת')
        } else {
          await activateTeamMemberAction(profile.id)
          toast.success('המשתמש הופעל')
        }
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteTeamMemberAction(deleteTarget.id)
        setDeleteTarget(null)
        router.refresh()
        toast.success('המשתמש נמחק')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  const roleColor: Record<UserRole, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    staff: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">ניהול צוות</h1>
        {isSuperAdmin && (
          <Button size="lg" onClick={() => setFormOpen(true)} className="shrink-0">
            <Plus className="size-5 me-1" />
            איש צוות חדש
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">אין אנשי צוות.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead>סטטוס</TableHead>
              {isSuperAdmin && <TableHead>פעולות</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const initials = member.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
              const isCurrentUser = member.id === user.id

              return (
                <TableRow key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={member.avatar_url ?? undefined} alt={member.full_name} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    {isSuperAdmin && !isCurrentUser ? (
                      <Select
                        defaultValue={member.role ?? 'staff'}
                        onValueChange={(val) => handleRoleChange(member.id, val as UserRole)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">{ROLE_LABELS.super_admin}</SelectItem>
                          <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                          <SelectItem value="staff">{ROLE_LABELS.staff}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={member.role ? roleColor[member.role] : ''}
                      >
                        {member.role ? ROLE_LABELS[member.role] : '—'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? 'default' : 'secondary'}>
                      {member.is_active ? 'פעיל' : 'מושבת'}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {!isCurrentUser && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(member)}
                            disabled={isPending}
                            title={member.is_active ? 'השבת' : 'הפעל'}
                          >
                            {member.is_active ? (
                              <UserX className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(member)}
                            disabled={isPending}
                            title="מחק לצמיתות"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <TeamMemberForm open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת איש צוות</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את {deleteTarget?.full_name} לצמיתות? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
