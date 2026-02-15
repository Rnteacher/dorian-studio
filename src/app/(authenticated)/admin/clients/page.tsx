import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from './clients-page-client'
import type { Client, Profile } from '@/types/database'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [clientsResult, profileResult] = await Promise.all([
    supabase.from('clients').select('*').order('updated_at', { ascending: false }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const clients = (clientsResult.data ?? []) as Client[]
  const isSuperAdmin = (profileResult.data as Profile | null)?.role === 'super_admin'

  return <ClientsPageClient clients={clients} isSuperAdmin={isSuperAdmin} />
}
