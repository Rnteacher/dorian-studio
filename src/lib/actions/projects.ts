'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createProjectFolder } from '@/lib/google-drive'

interface PhaseData {
  start_date: string
  end_date: string
  members: { user_id: string; role: string }[]
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = formData.get('name') as string
  const clientId = formData.get('client_id') as string

  if (!name?.trim()) throw new Error('שם פרויקט הוא שדה חובה')
  if (!clientId) throw new Error('יש לבחור לקוח')

  // Try to auto-create Google Drive folder
  let googleDriveUrl = (formData.get('google_drive_url') as string)?.trim() ?? ''
  if (!googleDriveUrl) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()

    const driveUrl = await createProjectFolder(
      name.trim(),
      (clientData as { name: string } | null)?.name ?? ''
    )
    if (driveUrl) googleDriveUrl = driveUrl
  }

  // Parse phases data
  const phasesJson = formData.get('phases') as string
  const phases: PhaseData[] = phasesJson ? JSON.parse(phasesJson) : []

  // Use first phase start_date and last phase end_date for project dates
  const projectStartDate = phases.length > 0 ? phases[0].start_date : ((formData.get('start_date') as string) || null)
  const projectDueDate = phases.length > 0 ? phases[phases.length - 1].end_date : ((formData.get('due_date') as string) || null)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: name.trim(),
      client_id: clientId,
      description: (formData.get('description') as string)?.trim() ?? '',
      google_drive_url: googleDriveUrl,
      start_date: projectStartDate,
      due_date: projectDueDate,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Create phases and members
  if (phases.length > 0) {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      const { data: phaseRow, error: phaseError } = await supabase
        .from('project_phases')
        .insert({
          project_id: project.id,
          start_date: phase.start_date,
          end_date: phase.end_date,
          order_index: i,
        })
        .select()
        .single()

      if (phaseError) throw new Error(phaseError.message)

      if (phase.members.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            phase.members.map((m) => ({
              project_id: project.id,
              user_id: m.user_id,
              role: m.role,
              phase_id: phaseRow.id,
            }))
          )
        if (membersError) throw new Error(membersError.message)
      }
    }
  }

  revalidatePath('/admin/clients')
  revalidatePath('/projects')
  return project
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('לא מחובר')

  // Verify admin or super_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role: string } | null)?.role
  if (!role || !['super_admin', 'admin'].includes(role)) {
    throw new Error('אין הרשאה — נדרש מנהל')
  }

  // Delete related data first
  const { data: taskIds } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)

  if (taskIds && taskIds.length > 0) {
    const ids = taskIds.map((t) => t.id)
    await supabase.from('task_now').delete().in('task_id', ids)
  }

  await supabase.from('tasks').delete().eq('project_id', projectId)
  await supabase.from('project_events').delete().eq('project_id', projectId)
  await supabase.from('project_notes').delete().eq('project_id', projectId)
  await supabase.from('project_members').delete().eq('project_id', projectId)
  await supabase.from('project_phases').delete().eq('project_id', projectId)
  await supabase.from('activity_log').delete().eq('project_id', projectId)

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/clients')
  revalidatePath('/projects')
  revalidatePath('/home')
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('שם פרויקט הוא שדה חובה')

  const { error } = await supabase
    .from('projects')
    .update({
      name: name.trim(),
      description: (formData.get('description') as string)?.trim() ?? '',
      google_drive_url: (formData.get('google_drive_url') as string)?.trim() ?? '',
      status: (formData.get('status') as string) ?? 'active',
      start_date: (formData.get('start_date') as string) || null,
      due_date: (formData.get('due_date') as string) || null,
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
}

export async function updateProjectWithMembersAction(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('שם פרויקט הוא שדה חובה')

  const clientId = formData.get('client_id') as string
  if (!clientId) throw new Error('יש לבחור לקוח')

  // Parse phases
  const phasesJson = formData.get('phases') as string
  const phases: PhaseData[] = phasesJson ? JSON.parse(phasesJson) : []

  const projectStartDate = phases.length > 0 ? phases[0].start_date : ((formData.get('start_date') as string) || null)
  const projectDueDate = phases.length > 0 ? phases[phases.length - 1].end_date : ((formData.get('due_date') as string) || null)

  // Update the project
  const { error } = await supabase
    .from('projects')
    .update({
      name: name.trim(),
      client_id: clientId,
      description: (formData.get('description') as string)?.trim() ?? '',
      google_drive_url: (formData.get('google_drive_url') as string)?.trim() ?? '',
      status: (formData.get('status') as string) ?? 'active',
      start_date: projectStartDate,
      due_date: projectDueDate,
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  // Sync phases: delete all existing phases + members, then insert new
  if (phasesJson) {
    // Delete old members and phases (members have CASCADE on phase_id)
    await supabase.from('project_members').delete().eq('project_id', projectId)
    await supabase.from('project_phases').delete().eq('project_id', projectId)

    // Insert new phases with members
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      const { data: phaseRow, error: phaseError } = await supabase
        .from('project_phases')
        .insert({
          project_id: projectId,
          start_date: phase.start_date,
          end_date: phase.end_date,
          order_index: i,
        })
        .select()
        .single()

      if (phaseError) throw new Error(phaseError.message)

      if (phase.members.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            phase.members.map((m) => ({
              project_id: projectId,
              user_id: m.user_id,
              role: m.role,
              phase_id: phaseRow.id,
            }))
          )
        if (membersError) throw new Error(membersError.message)
      }
    }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  revalidatePath('/admin/clients')
  revalidatePath('/home')
}
