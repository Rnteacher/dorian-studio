import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailClient } from './client-detail-client'
import type { Client, ClientContact, ClientInteraction, ClientFeedback, Profile } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    clientResult,
    contactsResult,
    projectsResult,
    profileResult,
    interactionsResult,
    feedbackResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, status, is_archived, project_members ( user_id, profiles ( id, full_name, avatar_url ) )')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
    supabase
      .from('client_interactions')
      .select('*, profiles:created_by ( full_name )')
      .eq('client_id', clientId)
      .order('interaction_date', { ascending: false })
      .then((res) => (res.error ? { data: [] } : res)),
    supabase
      .from('client_feedback')
      .select('*, profiles:created_by ( full_name ), projects:project_id ( name )')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .then((res) => (res.error ? { data: [] } : res)),
  ])

  if (!clientResult.data) notFound()

  const client = clientResult.data as unknown as Client
  const contacts = (contactsResult.data ?? []) as ClientContact[]
  const projects = (projectsResult.data ?? []) as unknown as Array<{
    id: string
    name: string
    status: string
    is_archived: boolean
    project_members: Array<{
      user_id: string
      profiles: { id: string; full_name: string; avatar_url: string | null } | null
    }>
  }>
  const role = (profileResult.data as Profile | null)?.role
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'super_admin' || role === 'admin'
  const interactions = (interactionsResult.data ?? []) as unknown as Array<
    ClientInteraction & { profiles?: { full_name: string } | null }
  >
  const feedback = (feedbackResult.data ?? []) as unknown as Array<
    ClientFeedback & { profiles?: { full_name: string } | null; projects?: { name: string } | null }
  >

  return (
    <ClientDetailClient
      client={client}
      contacts={contacts}
      projects={projects}
      interactions={interactions}
      feedback={feedback}
      isSuperAdmin={isSuperAdmin}
      isAdmin={isAdmin}
    />
  )
}
