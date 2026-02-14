import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from './clients-page-client'
import type { Client } from '@/types/database'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false })

  const clients = (data ?? []) as Client[]

  return <ClientsPageClient clients={clients} />
}
