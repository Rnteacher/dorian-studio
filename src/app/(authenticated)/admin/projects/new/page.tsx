import { createClient } from '@/lib/supabase/server'
import { NewProjectForm } from './new-project-form'
import type { Client, Profile } from '@/types/database'

interface Props {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewProjectPage({ searchParams }: Props) {
  const { clientId } = await searchParams
  const supabase = await createClient()

  const [clientsResult, usersResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('is_active', true)
      .not('role', 'is', null)
      .order('full_name'),
  ])

  const clients = (clientsResult.data ?? []) as Pick<Client, 'id' | 'name'>[]
  const users = (usersResult.data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>[]

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">פרויקט חדש</h1>
      <NewProjectForm
        clients={clients}
        users={users}
        defaultClientId={clientId}
      />
    </div>
  )
}
