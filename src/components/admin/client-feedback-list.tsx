'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { FeedbackForm } from '@/components/admin/feedback-form'
import { deleteFeedbackAction } from '@/lib/actions/client-feedback'
import { Plus, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { ClientFeedback } from '@/types/database'

interface FeedbackWithDetails extends ClientFeedback {
  profiles?: { full_name: string } | null
  projects?: { name: string } | null
}

interface ProjectOption {
  id: string
  name: string
}

interface Props {
  clientId: string
  feedback: FeedbackWithDetails[]
  projects: ProjectOption[]
  isAdmin?: boolean
}

export function ClientFeedbackList({ clientId, feedback, projects, isAdmin }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteFeedbackAction(deleteTarget, clientId)
        setDeleteTarget(null)
        router.refresh()
        toast.success('המשוב נמחק')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">משוב לקוח</h3>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="size-4 me-1" />
            משוב חדש
          </Button>
        )}
      </div>

      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין משובים עדיין.</p>
      ) : (
        <div className="space-y-3">
          {feedback.map((fb) => (
            <div
              key={fb.id}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {fb.projects?.name && (
                    <Link
                      href={`/admin/projects/${fb.project_id}/edit`}
                      className="text-sm font-medium hover:underline"
                    >
                      {fb.projects.name}
                    </Link>
                  )}
                  {!fb.projects?.name && fb.project_id && (
                    <Badge variant="outline">פרויקט</Badge>
                  )}
                  {!fb.project_id && (
                    <Badge variant="outline">כללי</Badge>
                  )}
                  {fb.rating && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-3.5 ${
                            star <= fb.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString('he-IL')}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(fb.id)}
                      disabled={isPending}
                      title="מחק"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{fb.content}</p>
              {fb.profiles?.full_name && (
                <p className="text-xs text-muted-foreground">
                  נרשם ע&quot;י {fb.profiles.full_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <FeedbackForm
        clientId={clientId}
        projects={projects}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת משוב</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את המשוב הזה? פעולה זו אינה ניתנת לביטול.
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
