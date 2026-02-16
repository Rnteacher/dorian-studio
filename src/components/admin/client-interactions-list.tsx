'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { InteractionForm } from '@/components/admin/interaction-form'
import { deleteInteractionAction } from '@/lib/actions/client-interactions'
import { INTERACTION_TYPE_LABEL } from '@/lib/constants/client'
import { Plus, Trash2, Phone, Mail, Video, MessageSquare, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { ClientInteraction } from '@/types/database'

interface InteractionWithAuthor extends ClientInteraction {
  profiles?: { full_name: string } | null
}

interface Props {
  clientId: string
  interactions: InteractionWithAuthor[]
  isAdmin?: boolean
}

const typeIcon: Record<string, typeof Phone> = {
  meeting: Video,
  call: Phone,
  email: Mail,
  note: MessageSquare,
  other: MoreHorizontal,
}

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  meeting: 'default',
  call: 'default',
  email: 'secondary',
  note: 'outline',
  other: 'outline',
}

export function ClientInteractionsList({ clientId, interactions, isAdmin }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteInteractionAction(deleteTarget, clientId)
        setDeleteTarget(null)
        router.refresh()
        toast.success('האינטראקציה נמחקה')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">היסטוריית תקשורת</h3>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            <Plus className="size-4 me-1" />
            תיעוד חדש
          </Button>
        )}
      </div>

      {interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין אינטראקציות מתועדות.</p>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => {
            const Icon = typeIcon[interaction.interaction_type] ?? MessageSquare
            return (
              <div
                key={interaction.id}
                className="flex gap-3 rounded-lg border p-3"
              >
                <div className="mt-0.5">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={typeBadgeVariant[interaction.interaction_type] ?? 'outline'}>
                      {INTERACTION_TYPE_LABEL[interaction.interaction_type] ?? interaction.interaction_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {new Date(interaction.interaction_date).toLocaleDateString('he-IL')}
                    </span>
                    {interaction.profiles?.full_name && (
                      <span className="text-xs text-muted-foreground">
                        — {interaction.profiles.full_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{interaction.summary}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => setDeleteTarget(interaction.id)}
                    disabled={isPending}
                    title="מחק"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <InteractionForm clientId={clientId} open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת אינטראקציה</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את האינטראקציה הזו? פעולה זו אינה ניתנת לביטול.
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
