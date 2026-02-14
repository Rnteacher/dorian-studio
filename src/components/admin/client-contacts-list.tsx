'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContactForm } from './contact-form'
import { deleteContactAction } from '@/lib/actions/contacts'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import type { ClientContact } from '@/types/database'

interface ClientContactsListProps {
  clientId: string
  contacts: ClientContact[]
}

export function ClientContactsList({ clientId, contacts }: ClientContactsListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null)

  function handleEdit(contact: ClientContact) {
    setEditingContact(contact)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditingContact(null)
    setFormOpen(true)
  }

  async function handleDelete(contact: ClientContact) {
    if (!confirm(`למחוק את ${contact.name}?`)) return
    try {
      await deleteContactAction(contact.id, clientId)
      toast.success('איש הקשר נמחק')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">אנשי קשר</h3>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="size-4 me-1" />
          הוסף
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין אנשי קשר עדיין.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contact.name}</span>
                  {contact.is_primary && <Badge variant="secondary">ראשי</Badge>}
                  {contact.role_title && (
                    <span className="text-sm text-muted-foreground">
                      · {contact.role_title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:underline" dir="ltr">
                      <Mail className="size-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline" dir="ltr">
                      <Phone className="size-3" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(contact)}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(contact)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        clientId={clientId}
        contact={editingContact}
      />
    </div>
  )
}
