'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ClientForm } from '@/components/admin/client-form'
import { ClientContactsList } from '@/components/admin/client-contacts-list'
import { ArrowRight, Pencil, Plus } from 'lucide-react'
import type { Client, ClientContact, Project } from '@/types/database'

interface Props {
  client: Client
  contacts: ClientContact[]
  projects: Pick<Project, 'id' | 'name' | 'status' | 'is_archived'>[]
}

const statusLabel: Record<string, string> = {
  active: 'פעיל',
  on_hold: 'מושהה',
  completed: 'הושלם',
}

export function ClientDetailClient({ client, contacts, projects }: Props) {
  const [editOpen, setEditOpen] = useState(false)

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
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4 me-1" />
          עריכה
        </Button>
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
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <span className="font-medium">{project.name}</span>
                <Badge variant={project.is_archived ? 'outline' : 'secondary'}>
                  {project.is_archived ? 'ארכיון' : statusLabel[project.status] ?? project.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ClientForm open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  )
}
