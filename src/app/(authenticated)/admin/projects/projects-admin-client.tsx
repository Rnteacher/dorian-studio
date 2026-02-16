'use client'

import { useState, useMemo } from 'react'
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
import { deleteProjectAction } from '@/lib/actions/projects'
import { Search, Trash2, ArrowUpDown, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'

interface ProjectRow {
  id: string
  name: string
  status: string
  is_archived: boolean
  start_date: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  client_id: string
  clients: { name: string } | null
}

interface ProjectsAdminClientProps {
  projects: ProjectRow[]
  isSuperAdmin?: boolean
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  active: 'פעיל',
  on_hold: 'מושהה',
  completed: 'הושלם',
}

const PROJECT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  on_hold: 'secondary',
  completed: 'outline',
}

const STATUS_SORT_ORDER: Record<string, number> = {
  active: 0,
  on_hold: 1,
  completed: 2,
}

type SortColumn = 'name' | 'client' | 'status' | 'start_date' | 'due_date'
type SortDirection = 'asc' | 'desc'

export function ProjectsAdminClient({ projects, isSuperAdmin }: ProjectsAdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = projects.filter((p) => {
      if (!showArchived && p.is_archived) return false
      if (q) {
        const clientName = p.clients?.name?.toLowerCase() ?? ''
        if (!p.name.toLowerCase().includes(q) && !clientName.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'he')
          break
        case 'client':
          cmp = (a.clients?.name ?? '').localeCompare(b.clients?.name ?? '', 'he')
          break
        case 'status': {
          const aOrder = a.is_archived ? 99 : (STATUS_SORT_ORDER[a.status] ?? 50)
          const bOrder = b.is_archived ? 99 : (STATUS_SORT_ORDER[b.status] ?? 50)
          cmp = aOrder - bOrder
          break
        }
        case 'start_date':
          cmp = (a.start_date ?? '').localeCompare(b.start_date ?? '')
          break
        case 'due_date':
          cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '')
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return list
  }, [projects, search, showArchived, sortColumn, sortDirection])

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteProjectAction(deleteTarget.id)
        setDeleteTarget(null)
        router.refresh()
        toast.success('הפרויקט נמחק')
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  const archivedCount = projects.filter((p) => p.is_archived).length

  function SortableHead({ column, children }: { column: SortColumn; children: React.ReactNode }) {
    return (
      <TableHead>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => handleSort(column)}
        >
          {children}
          <ArrowUpDown className={`size-3 ${sortColumn === column ? 'text-foreground' : 'text-muted-foreground/50'}`} />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">פרויקטים</h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש פרויקט או לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="size-4 me-1" />
          {showArchived ? 'הסתר ארכיון' : 'הצג ארכיון'}
          {!showArchived && archivedCount > 0 && (
            <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
              {archivedCount}
            </Badge>
          )}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {search ? 'לא נמצאו פרויקטים תואמים.' : 'אין פרויקטים להצגה.'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="name">שם פרויקט</SortableHead>
              <SortableHead column="client">לקוח</SortableHead>
              <SortableHead column="status">סטטוס</SortableHead>
              <SortableHead column="start_date">תאריך התחלה</SortableHead>
              <SortableHead column="due_date">תאריך יעד</SortableHead>
              {isSuperAdmin && <TableHead>פעולות</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((project) => (
              <TableRow key={project.id} className={project.is_archived ? 'opacity-50' : ''}>
                <TableCell>
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {project.clients ? (
                    <Link
                      href={`/admin/clients/${project.client_id}`}
                      className="hover:underline text-muted-foreground"
                    >
                      {project.clients.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.is_archived ? (
                    <Badge variant="outline">ארכיון</Badge>
                  ) : (
                    <Badge variant={PROJECT_STATUS_VARIANT[project.status] ?? 'outline'}>
                      {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString('he-IL')
                    : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.due_date
                    ? new Date(project.due_date).toLocaleDateString('he-IL')
                    : '—'}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(project)}
                      disabled={isPending}
                      title="מחק לצמיתות"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרויקט</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את &quot;{deleteTarget?.name}&quot; לצמיתות? פעולה זו אינה ניתנת לביטול.
              כל המשימות, הצוות וההערות של הפרויקט יימחקו גם הם.
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
