import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailClient } from './client-detail-client'
import type { Client, ClientContact, Project, Profile } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [clientResult, contactsResult, projectsResult, profileResult] = await Promise.all([
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
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  if (!clientResult.data) notFound()

  const client = clientResult.data as Client
  const contacts = (contactsResult.data ?? []) as ClientContact[]
  const projects = (projectsResult.data ?? []) as Pick<Project, 'id' | 'name' | 'status' | 'is_archived'>[]
  const isSuperAdmin = (profileResult.data as Profile | null)?.role === 'super_admin'

  return (
    <ClientDetailClient
      client={client}
      contacts={contacts}
      projects={projects}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
