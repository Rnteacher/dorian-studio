'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ClientForm } from '@/components/admin/client-form'
import { deleteClientAction, toggleClientActiveAction } from '@/lib/actions/clients'
import { Plus, Search, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '@/types/database'

interface ClientsPageClientProps {
  clients: Client[]
  isSuperAdmin?: boolean
}

export function ClientsPageClient({ clients, isSuperAdmin }: ClientsPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = clients.filter((c) => {
    if (!showInactive && !c.is_active) return false
    if (search && !c.name.includes(search)) return false
    return true
  })

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteClientAction(deleteTarget.id)
        setDeleteTarget(null)
        router.refresh()
        toast.success('הלקוח נמחק')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleToggleActive(client: Client) {
    startTransition(async () => {
      try {
        await toggleClientActiveAction(client.id, !client.is_active)
        // When deactivating — show inactive clients so user sees the change
        if (client.is_active) setShowInactive(true)
        router.refresh()
        toast.success(client.is_active ? 'הלקוח הועבר ללא פעיל' : 'הלקוח הופעל מחדש')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <Button size="lg" onClick={() => setFormOpen(true)} className="shrink-0">
          <Plus className="size-5 me-1" />
          לקוח חדש
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'הסתר לא פעילים' : 'הצג הכל'}
          {!showInactive && clients.some((c) => !c.is_active) && (
            <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
              {clients.filter((c) => !c.is_active).length}
            </Badge>
          )}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          {!showInactive && clients.some((c) => !c.is_active) ? (
            <>
              <p className="text-muted-foreground text-lg">
                אין לקוחות פעילים. יש {clients.filter((c) => !c.is_active).length} לקוחות לא פעילים.
              </p>
              <Button variant="outline" size="lg" onClick={() => setShowInactive(true)}>
                הצג לקוחות לא פעילים
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-lg">לא נמצאו לקוחות.</p>
              <Button variant="outline" size="lg" onClick={() => setFormOpen(true)}>
                <Plus className="size-5 me-1" />
                הוסף לקוח ראשון
              </Button>
            </>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם לקוח</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>הערות</TableHead>
              <TableHead>עדכון אחרון</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id} className={!client.is_active ? 'opacity-50' : ''}>
                <TableCell>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="font-medium hover:underline"
                  >
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {client.notes || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(client.updated_at).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(client)}
                      disabled={isPending}
                      title={client.is_active ? 'העבר ללא פעיל' : 'הפעל מחדש'}
                    >
                      {client.is_active
                        ? <PowerOff className="size-4 text-muted-foreground" />
                        : <Power className="size-4 text-green-600" />
                      }
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(client)}
                        disabled={isPending}
                        title="מחק לצמיתות"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ClientForm open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת לקוח</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את &quot;{deleteTarget?.name}&quot; לצמיתות? פעולה זו אינה ניתנת לביטול.
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
    </div>
  )
}
