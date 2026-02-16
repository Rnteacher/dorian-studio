'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ClientContactsList } from '@/components/admin/client-contacts-list'
import { ClientInteractionsList } from '@/components/admin/client-interactions-list'
import { ClientFeedbackList } from '@/components/admin/client-feedback-list'
import { deleteClientAction, toggleClientActiveAction } from '@/lib/actions/clients'
import { deleteProjectAction } from '@/lib/actions/projects'
import {
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_VARIANT,
  FUTURE_POTENTIAL_LABEL,
} from '@/lib/constants/client'
import {
  ArrowRight,
  Pencil,
  Plus,
  Trash2,
  Power,
  PowerOff,
  FileText,
  Users,
  FolderOpen,
  MessageSquare,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Client, ClientContact, ClientInteraction, ClientFeedback } from '@/types/database'

interface ProjectWithMembers {
  id: string
  name: string
  status: string
  is_archived: boolean
  project_members: Array<{
    user_id: string
    profiles: { id: string; full_name: string; avatar_url: string | null } | null
  }>
}

interface InteractionWithAuthor extends ClientInteraction {
  profiles?: { full_name: string } | null
}

interface FeedbackWithDetails extends ClientFeedback {
  profiles?: { full_name: string } | null
  projects?: { name: string } | null
}

interface Props {
  client: Client
  contacts: ClientContact[]
  projects: ProjectWithMembers[]
  interactions: InteractionWithAuthor[]
  feedback: FeedbackWithDetails[]
  isSuperAdmin?: boolean
  isAdmin?: boolean
}

const projectStatusLabel: Record<string, string> = {
  active: 'פעיל',
  on_hold: 'מושהה',
  completed: 'הושלם',
}

export function ClientDetailClient({
  client,
  contacts,
  projects,
  interactions,
  feedback,
  isSuperAdmin,
  isAdmin,
}: Props) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectWithMembers | null>(null)
  const [isPending, startTransition] = useTransition()

  // Derive unique team members who worked with this client
  const teamMembers = useMemo(() => {
    const memberMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; projectCount: number }>()
    for (const project of projects) {
      for (const pm of project.project_members ?? []) {
        if (!pm.profiles) continue
        const existing = memberMap.get(pm.profiles.id)
        if (existing) {
          existing.projectCount++
        } else {
          memberMap.set(pm.profiles.id, {
            id: pm.profiles.id,
            full_name: pm.profiles.full_name,
            avatar_url: pm.profiles.avatar_url,
            projectCount: 1,
          })
        }
      }
    }
    return Array.from(memberMap.values())
  }, [projects])

  // Project options for feedback form
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/clients" className="hover:underline">
          לקוחות
        </Link>
        <ArrowRight className="size-3 rtl:rotate-180" />
        <span>{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <Badge variant={CLIENT_STATUS_VARIANT[client.status] ?? 'outline'}>
            {CLIENT_STATUS_LABEL[client.status] ?? client.status}
          </Badge>
          {!client.is_active && (
            <Badge variant="secondary">לא פעיל</Badge>
          )}
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
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Pencil className="size-4 me-1" />
              עריכה
            </Link>
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <FileText className="size-4 me-1" />
            סקירה
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="size-4 me-1" />
            אנשי קשר
            {contacts.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
                {contacts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderOpen className="size-4 me-1" />
            פרויקטים
            {projects.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
                {projects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="communication">
            <MessageSquare className="size-4 me-1" />
            תקשורת
            {interactions.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
                {interactions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <Star className="size-4 me-1" />
            משוב
            {feedback.length > 0 && (
              <Badge variant="secondary" className="ms-1.5 px-1.5 py-0 text-[10px]">
                {feedback.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Brief */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">בריף לקוח</CardTitle>
            </CardHeader>
            <CardContent>
              {client.brief ? (
                <p className="whitespace-pre-wrap text-sm">{client.brief}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  לא הוגדר בריף.{' '}
                  <Link href={`/admin/clients/${client.id}/edit`} className="underline">
                    הוסף בריף
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Budget & Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">תקציב ותשלום</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={client.is_paid ? 'default' : 'secondary'}>
                    {client.is_paid ? 'בתשלום' : 'התנדבותי'}
                  </Badge>
                </div>
                {client.budget_range && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">טווח תקציב: </span>
                    <span dir="ltr">{client.budget_range}</span>
                  </div>
                )}
                {client.payment_terms && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">תנאי תשלום: </span>
                    <span className="whitespace-pre-wrap">{client.payment_terms}</span>
                  </div>
                )}
                {!client.budget_range && !client.payment_terms && !client.is_paid && (
                  <p className="text-sm text-muted-foreground">לא הוגדרו פרטי תקציב.</p>
                )}
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">פרטים מקצועיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.referral_source && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">מקור הפניה: </span>
                    {client.referral_source}
                  </div>
                )}
                {client.future_potential && client.future_potential !== 'unknown' && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">פוטנציאל: </span>
                    {FUTURE_POTENTIAL_LABEL[client.future_potential] ?? client.future_potential}
                  </div>
                )}
                {client.interest_areas && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">תחומי עניין: </span>
                    <span className="whitespace-pre-wrap">{client.interest_areas}</span>
                  </div>
                )}
                {!client.referral_source && !client.interest_areas &&
                  (!client.future_potential || client.future_potential === 'unknown') && (
                  <p className="text-sm text-muted-foreground">לא הוגדרו פרטים מקצועיים.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Internal Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">הערות פנימיות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <ClientContactsList clientId={client.id} contacts={contacts} />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">פרויקטים</h3>
              {isAdmin && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/projects/new?clientId=${client.id}`}>
                    <Plus className="size-4 me-1" />
                    פרויקט חדש
                  </Link>
                </Button>
              )}
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
                        {project.is_archived ? 'ארכיון' : projectStatusLabel[project.status] ?? project.status}
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

          <Separator />

          {/* Team Members */}
          <div className="space-y-3">
            <h3 className="font-semibold">חניכים שעבדו עם הלקוח</h3>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין חניכים שעבדו עם הלקוח.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <Badge key={member.id} variant="outline" className="py-1.5 px-3">
                    {member.full_name}
                    {member.projectCount > 1 && (
                      <span className="text-muted-foreground ms-1">({member.projectCount} פרויקטים)</span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <ClientInteractionsList
            clientId={client.id}
            interactions={interactions}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <ClientFeedbackList
            clientId={client.id}
            feedback={feedback}
            projects={projectOptions}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Client Dialog */}
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

      {/* Delete Project Dialog */}
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
