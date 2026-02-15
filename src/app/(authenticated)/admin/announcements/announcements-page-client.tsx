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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AnnouncementForm } from '@/components/admin/announcement-form'
import { updateAnnouncementAction, deleteAnnouncementAction } from '@/lib/actions/announcements'
import { Plus, Trash2, Power, PowerOff, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Announcement } from '@/types/database'

interface Props {
  announcements: Announcement[]
}

export function AnnouncementsPageClient({ announcements }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggleActive(a: Announcement) {
    startTransition(async () => {
      try {
        await updateAnnouncementAction(a.id, { is_active: !a.is_active })
        router.refresh()
        toast.success(a.is_active ? 'ההודעה הושבתה' : 'ההודעה הופעלה')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteAnnouncementAction(deleteTarget.id)
        setDeleteTarget(null)
        router.refresh()
        toast.success('ההודעה נמחקה')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">הודעות מערכת</h1>
        <Button size="lg" onClick={() => { setEditTarget(null); setFormOpen(true) }} className="shrink-0">
          <Plus className="size-5 me-1" />
          הודעה חדשה
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">אין הודעות.</p>
          <Button variant="outline" size="lg" onClick={() => setFormOpen(true)}>
            <Plus className="size-5 me-1" />
            צור הודעה ראשונה
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>כותרת</TableHead>
              <TableHead>תוכן</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תפוגה</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((a) => (
              <TableRow key={a.id} className={!a.is_active ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {a.body || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={a.is_active ? 'default' : 'secondary'}>
                    {a.is_active ? 'פעילה' : 'מושבתת'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {a.expires_at
                    ? new Date(a.expires_at).toLocaleDateString('he-IL')
                    : 'ללא'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(a)}
                      disabled={isPending}
                      title={a.is_active ? 'השבת' : 'הפעל'}
                    >
                      {a.is_active
                        ? <PowerOff className="size-4 text-muted-foreground" />
                        : <Power className="size-4 text-green-600" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditTarget(a); setFormOpen(true) }}
                      disabled={isPending}
                      title="ערוך"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(a)}
                      disabled={isPending}
                      title="מחק"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AnnouncementForm
        open={formOpen}
        onOpenChange={setFormOpen}
        announcement={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הודעה</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את &quot;{deleteTarget?.title}&quot;? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
