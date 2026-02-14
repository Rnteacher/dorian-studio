import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailClient } from './client-detail-client'
import type { Client, ClientContact, Project } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { clientId } = await params
  const supabase = await createClient()

  const [clientResult, contactsResult, projectsResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, status, is_archived')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
  ])

  if (!clientResult.data) notFound()

  const client = clientResult.data as Client
  const contacts = (contactsResult.data ?? []) as ClientContact[]
  const projects = (projectsResult.data ?? []) as Pick<Project, 'id' | 'name' | 'status' | 'is_archived'>[]

  return (
    <ClientDetailClient
      client={client}
      contacts={contacts}
      projects={projects}
    />
  )
}
