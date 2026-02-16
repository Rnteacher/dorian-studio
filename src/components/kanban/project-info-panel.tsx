'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createNoteAction, deleteNoteAction } from '@/lib/actions/notes'
import { toast } from 'sonner'
import { Phone, Mail, Trash2, Send, Calendar, ArrowLeft, Users } from 'lucide-react'
import type { Project, Client, ClientContact, ProjectNote, Profile, ProjectPhase } from '@/types/database'

interface NoteWithProfile extends ProjectNote {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface PhaseWithLead extends ProjectPhase {
  lead_name: string | null
  member_count: number
}

interface ProjectInfoPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  client: Client
  contacts: ClientContact[]
  notes: NoteWithProfile[]
  phases: PhaseWithLead[]
  userId: string
}

export function ProjectInfoPanel({
  open,
  onOpenChange,
  project,
  client,
  contacts,
  notes,
  phases,
  userId,
}: ProjectInfoPanelProps) {
  const router = useRouter()
  const [noteContent, setNoteContent] = useState('')
  const [noteTab, setNoteTab] = useState<'shared' | 'private'>('shared')
  const [isPending, startTransition] = useTransition()

  const sharedNotes = notes.filter((n) => !n.is_private)
  const privateNotes = notes.filter((n) => n.is_private && n.user_id === userId)

  function handleAddNote() {
    if (!noteContent.trim()) return
    startTransition(async () => {
      try {
        await createNoteAction(project.id, noteContent, noteTab === 'private')
        setNoteContent('')
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      try {
        await deleteNoteAction(noteId, project.id)
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message)
      }
    })
  }

  // Find the current phase (today's date)
  const today = new Date().toISOString().split('T')[0]
  const currentPhaseIndex = phases.findIndex(
    (p) => today >= p.start_date && today <= p.end_date
  )
  const currentPhase = currentPhaseIndex >= 0 ? phases[currentPhaseIndex] : null
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex + 1 < phases.length
    ? phases[currentPhaseIndex + 1]
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[65vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle>מידע על הפרויקט</SheetTitle>
        </SheetHeader>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-4 pb-4">
          {/* 1. Client Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="size-4" />
              פרטי לקוח — {client.name}
            </h4>
            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין אנשי קשר</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="text-sm space-y-0.5">
                    <p className="font-medium">
                      {c.name}
                      {c.role_title && <span className="text-muted-foreground font-normal"> · {c.role_title}</span>}
                      {c.is_primary && <Badge variant="secondary" className="ms-1 text-[10px] px-1 py-0">ראשי</Badge>}
                    </p>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline" dir="ltr">
                        <Phone className="size-3" />
                        {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline" dir="ltr">
                        <Mail className="size-3" />
                        {c.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Brief / Description */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">בריף</h4>
            {project.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">לא הוגדר בריף</p>
            )}
          </div>

          {/* 3. Notes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">הערות</h4>
            <Tabs value={noteTab} onValueChange={(v) => setNoteTab(v as 'shared' | 'private')}>
              <TabsList className="h-7">
                <TabsTrigger value="shared" className="text-xs px-2 h-6">צוות ({sharedNotes.length})</TabsTrigger>
                <TabsTrigger value="private" className="text-xs px-2 h-6">אישיות ({privateNotes.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="shared" className="mt-2 space-y-2">
                {sharedNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">אין הערות צוות עדיין</p>
                )}
                {sharedNotes.map((n) => (
                  <NoteItem
                    key={n.id}
                    note={n}
                    canDelete={n.user_id === userId}
                    onDelete={() => handleDeleteNote(n.id)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="private" className="mt-2 space-y-2">
                {privateNotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">אין הערות אישיות עדיין</p>
                )}
                {privateNotes.map((n) => (
                  <NoteItem
                    key={n.id}
                    note={n}
                    canDelete
                    onDelete={() => handleDeleteNote(n.id)}
                  />
                ))}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={noteTab === 'shared' ? 'הערה לצוות...' : 'הערה אישית...'}
                rows={2}
                className="text-xs"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAddNote}
                disabled={isPending || !noteContent.trim()}
                className="shrink-0 self-end"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>

          {/* 4. Phases / Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="size-4" />
              שלבי פרויקט
            </h4>
            {phases.length === 0 ? (
              <p className="text-xs text-muted-foreground">לא הוגדרו שלבים</p>
            ) : (
              <div className="space-y-2">
                {currentPhase && (
                  <div className="rounded border border-green-200 bg-green-50 p-2 text-sm">
                    <p className="font-medium text-green-800">
                      שלב נוכחי{currentPhase.lead_name && ` — הצוות של ${currentPhase.lead_name}`}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      דדליין: {format(new Date(currentPhase.end_date), 'd MMMM yyyy', { locale: he })}
                    </p>
                    <p className="text-xs text-green-600">
                      {currentPhase.member_count} חברי צוות
                    </p>
                  </div>
                )}

                {nextPhase && (
                  <div className="rounded border p-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ArrowLeft className="size-3" />
                      <span className="text-xs font-medium">
                        עובר ל{nextPhase.lead_name ? `צוות של ${nextPhase.lead_name}` : 'שלב הבא'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      מ-{format(new Date(nextPhase.start_date), 'd MMMM yyyy', { locale: he })}
                    </p>
                  </div>
                )}

                {!currentPhase && (
                  <div className="space-y-1.5">
                    {phases.map((p, i) => (
                      <div key={p.id} className="text-xs text-muted-foreground">
                        שלב {i + 1}{p.lead_name && ` (${p.lead_name})`}: {format(new Date(p.start_date), 'd/M/yy')} — {format(new Date(p.end_date), 'd/M/yy')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NoteItem({
  note,
  canDelete,
  onDelete,
}: {
  note: NoteWithProfile
  canDelete: boolean
  onDelete: () => void
}) {
  return (
    <div className="rounded border p-2 text-xs group">
      <div className="flex items-center justify-between">
        <span className="font-medium">{note.profiles?.full_name ?? 'משתמש'}</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">
            {format(new Date(note.created_at), 'd/M HH:mm')}
          </span>
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-5 opacity-0 group-hover:opacity-100"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{note.content}</p>
    </div>
  )
}
