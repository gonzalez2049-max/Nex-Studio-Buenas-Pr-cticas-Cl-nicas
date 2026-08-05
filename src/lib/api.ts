import { supabase } from '@/lib/supabase'
import type {
  ActivityLog,
  AppNotification,
  NotificationType,
  Observation,
  Profile,
  Project,
  ProjectWithRelations,
  Resource,
  Template,
  TransferRecord,
} from '@/types/database'
import type { MaterialFormat, ProjectState } from '@/lib/domain'
import { STATE_LABELS } from '@/lib/domain'

/* ----------------------------------------------------------- Perfiles */

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function updateProfileRole(
  id: string,
  role: Profile['role'],
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
}

/* --------------------------------------------------------- Plantillas */

export async function listTemplates(
  format?: MaterialFormat,
): Promise<Template[]> {
  let query = supabase
    .from('templates')
    .select('*')
    .order('is_official', { ascending: false })
    .order('name', { ascending: true })
  if (format) query = query.eq('format', format)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Template[]
}

/* ----------------------------------------------------------- Proyectos */

const PROJECT_SELECT = `
  *,
  owner:profiles!projects_owner_id_fkey (id, full_name, avatar_url, role),
  reviewer:profiles!projects_assigned_reviewer_id_fkey (id, full_name, avatar_url),
  template:templates (id, name)
`

export interface ProjectFilters {
  status?: ProjectState | 'all'
  format?: MaterialFormat | 'all'
  ownerId?: string
  search?: string
}

export async function listProjects(
  filters: ProjectFilters = {},
): Promise<ProjectWithRelations[]> {
  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('updated_at', { ascending: false })

  if (filters.status && filters.status !== 'all')
    query = query.eq('status', filters.status)
  if (filters.format && filters.format !== 'all')
    query = query.eq('format', filters.format)
  if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ProjectWithRelations[]
}

export async function getProject(
  id: string,
): Promise<ProjectWithRelations | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as ProjectWithRelations | null
}

export interface CreateProjectInput {
  title: string
  description?: string
  format: MaterialFormat
  template_id?: string | null
  content?: Record<string, unknown>
  tags?: string[]
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sin sesión activa')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: input.title,
      description: input.description ?? null,
      format: input.format,
      template_id: input.template_id ?? null,
      content: input.content ?? {},
      tags: input.tags ?? [],
      owner_id: user.id,
      status: 'borrador',
    })
    .select()
    .single()
  if (error) throw error

  await logActivity({
    project_id: data.id,
    action: 'created',
    to_status: 'borrador',
  })
  return data as Project
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

/**
 * Cambia el estado de un proyecto respetando el flujo editorial, registra la
 * actividad y notifica a las personas implicadas.
 */
export async function transitionProject(args: {
  project: Project
  to: ProjectState
  reviewerId?: string | null
  note?: string
}): Promise<Project> {
  const { project, to, reviewerId, note } = args
  const patch: Partial<Project> = { status: to }

  if (to === 'publicado') patch.published_at = new Date().toISOString()
  if (reviewerId !== undefined) patch.assigned_reviewer_id = reviewerId
  if (to === 'pendiente_revision' && reviewerId)
    patch.assigned_reviewer_id = reviewerId

  const updated = await updateProject(project.id, patch)

  await logActivity({
    project_id: project.id,
    action: 'status_change',
    from_status: project.status,
    to_status: to,
    meta: note ? { note } : undefined,
  })

  // Notificaciones según destino.
  if (to === 'pendiente_revision' && reviewerId) {
    await createNotification({
      user_id: reviewerId,
      type: 'review_requested',
      title: 'Nueva revisión asignada',
      body: `Se te asignó revisar «${project.title}».`,
      link: `/proyectos/${project.id}`,
    })
  }
  if (
    (to === 'con_observaciones' || to === 'aprobado' || to === 'publicado') &&
    project.owner_id
  ) {
    const typeMap: Record<string, NotificationType> = {
      con_observaciones: 'observation_added',
      aprobado: 'approved',
      publicado: 'published',
    }
    await createNotification({
      user_id: project.owner_id,
      type: typeMap[to],
      title: `Material ${STATE_LABELS[to].toLowerCase()}`,
      body: `«${project.title}» cambió a estado ${STATE_LABELS[to]}.`,
      link: `/proyectos/${project.id}`,
    })
  }

  return updated
}

/* -------------------------------------------------------- Observaciones */

export async function listObservations(
  projectId: string,
): Promise<Observation[]> {
  const { data, error } = await supabase
    .from('observations')
    .select('*, author:profiles (id, full_name, avatar_url, role)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Observation[]
}

export async function addObservation(
  projectId: string,
  body: string,
): Promise<Observation> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sin sesión activa')
  const { data, error } = await supabase
    .from('observations')
    .insert({ project_id: projectId, author_id: user.id, body })
    .select('*, author:profiles (id, full_name, avatar_url, role)')
    .single()
  if (error) throw error
  return data as Observation
}

export async function resolveObservation(
  id: string,
  resolved: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('observations')
    .update({ resolved })
    .eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------ Registro transferencia */

export async function listTransferRecords(): Promise<TransferRecord[]> {
  const { data, error } = await supabase
    .from('transfer_records')
    .select('*, project:projects (id, title, format)')
    .order('transferred_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TransferRecord[]
}

export async function createTransferRecord(input: {
  project_id: string
  channel: string
  audience?: string
  reach?: number
  notes?: string
}): Promise<TransferRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sin sesión activa')
  const { data, error } = await supabase
    .from('transfer_records')
    .insert({
      project_id: input.project_id,
      channel: input.channel,
      audience: input.audience ?? null,
      reach: input.reach ?? 0,
      notes: input.notes ?? null,
      transferred_by: user.id,
    })
    .select('*, project:projects (id, title, format)')
    .single()
  if (error) throw error
  return data as TransferRecord
}

/* ----------------------------------------------------------- Recursos */

export async function listResources(championKit = false): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (championKit) query = query.eq('is_champion_kit', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Resource[]
}

/* ------------------------------------------------------- Notificaciones */

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as AppNotification[]
}

export async function createNotification(input: {
  user_id: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  })
  if (error) console.error('No se pudo crear la notificación:', error.message)
}

export async function markNotificationRead(
  id: string,
  read = true,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
  if (error) throw error
}

/* ------------------------------------------------------------ Actividad */

export async function logActivity(input: {
  project_id?: string | null
  action: string
  from_status?: ProjectState | null
  to_status?: ProjectState | null
  meta?: Record<string, unknown>
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase.from('activity_log').insert({
    project_id: input.project_id ?? null,
    actor_id: user?.id ?? null,
    action: input.action,
    from_status: input.from_status ?? null,
    to_status: input.to_status ?? null,
    meta: input.meta ?? null,
  })
  if (error) console.error('No se pudo registrar la actividad:', error.message)
}

export async function listActivity(limit = 15): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:profiles (id, full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as ActivityLog[]
}

/* -------------------------------------------------------------- Métricas */

export interface DashboardMetrics {
  total: number
  byStatus: Record<ProjectState, number>
  pendingReview: number
  published: number
  expiringSoon: number
  drafts: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase
    .from('projects')
    .select('status, expires_at')
  if (error) throw error

  const rows = (data ?? []) as { status: ProjectState; expires_at: string | null }[]
  const byStatus = Object.fromEntries(
    Object.keys(STATE_LABELS).map((s) => [s, 0]),
  ) as Record<ProjectState, number>

  const soon = new Date()
  soon.setDate(soon.getDate() + 30)

  let expiringSoon = 0
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
    if (
      row.expires_at &&
      row.status === 'publicado' &&
      new Date(row.expires_at) <= soon
    )
      expiringSoon += 1
  }

  return {
    total: rows.length,
    byStatus,
    pendingReview: byStatus.pendiente_revision,
    published: byStatus.publicado,
    drafts: byStatus.borrador + byStatus.en_edicion,
    expiringSoon,
  }
}
