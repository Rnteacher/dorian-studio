'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { ClientForm } from '@/components/admin/client-form'
import { ClientContactsList } from '@/components/admin/client-contacts-list'
import { deleteClientAction, toggleClientActiveAction } from '@/lib/actions/clients'
import { deleteProjectAction } from '@/lib/actions/projects'
import { ArrowRight, Pencil, Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Client, ClientContact, Project } from '@/types/database'

interface Props {
  client: Client
  contacts: ClientContact[]
  projects: Pick<Project, 'id' | 'name' | 'status' | 'is_archived'>[]
  isSuperAdmin?: boolean
  isAdmin?: boolean
}

const statusLabel: Record<string, string> = {
  active: 'פעיל',
  on_hold: 'מושהה',
  completed: 'הושלם',
}

export function ClientDetailClient({ client, contacts, projects, isSuperAdmin, isAdmin }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Pick<Project, 'id' | 'name' | 'status' | 'is_archived'> | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteClientAction(client.id)
        toast.success('הלקוח נמחק')
        router.push('/admin/clients')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleDeleteProject() {
    if (!deleteProjectTarget) return
    startTransition(async () => {
      try {
        await deleteProjectAction(deleteProjectTarget.id)
        setDeleteProjectTarget(null)
        router.refresh()
        toast.success('הפרויקט נמחק')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleToggleActive() {
    startTransition(async () => {
      try {
        await toggleClientActiveAction(client.id, !client.is_active)
        router.refresh()
        toast.success(client.is_active ? 'הלקוח הועבר ללא פעיל' : 'הלקוח הופעל מחדש')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/clients" className="hover:underline">
          לקוחות
        </Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>{client.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <Badge variant={client.is_active ? 'default' : 'secondary'}>
            {client.is_active ? 'פעיל' : 'לא פעיל'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isPending}
          >
            {client.is_active
              ? <><PowerOff className="size-4 me-1" />העבר ללא פעיל</>
              : <><Power className="size-4 me-1 text-green-600" />הפעל מחדש</>
            }
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4 me-1" />
            עריכה
          </Button>
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="size-4 me-1" />
              מחק
            </Button>
          )}
        </div>
      </div>

      {client.notes && (
        <p className="text-muted-foreground">{client.notes}</p>
      )}

      <Separator />

      {/* Contacts */}
      <ClientContactsList clientId={client.id} contacts={contacts} />

      <Separator />

      {/* Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">פרויקטים</h3>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/projects/new?clientId=${client.id}`}>
              <Plus className="size-4 me-1" />
              פרויקט חדש
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין פרויקטים עדיין.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <Link href={`/admin/projects/${project.id}/edit`} className="flex-1 min-w-0">
                  <span className="font-medium">{project.name}</span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={project.is_archived ? 'outline' : 'secondary'}>
                    {project.is_archived ? 'ארכיון' : statusLabel[project.status] ?? project.status}
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteProjectTarget(project)}
                      disabled={isPending}
                      title="מחק פרויקט"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientForm open={editOpen} onOpenChange={setEditOpen} client={client} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת לקוח</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את &quot;{client.name}&quot; לצמיתות? פעולה זו אינה ניתנת לביטול.
              כל אנשי הקשר של הלקוח יימחקו גם הם.
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

      <AlertDialog open={!!deleteProjectTarget} onOpenChange={(open) => !open && setDeleteProjectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרויקט</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את &quot;{deleteProjectTarget?.name}&quot; לצמיתות?
              כל המשימות, האירועים וחברי הצוות של הפרויקט יימחקו גם הם.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק פרויקט
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
