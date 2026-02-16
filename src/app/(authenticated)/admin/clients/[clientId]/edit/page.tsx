import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditClientForm } from './edit-client-form'
import type { Client } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function EditClientPage({ params }: Props) {
  const { clientId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error || !data) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">עריכת לקוח</h1>
      <EditClientForm client={data as unknown as Client} />
    </div>
  )
}
