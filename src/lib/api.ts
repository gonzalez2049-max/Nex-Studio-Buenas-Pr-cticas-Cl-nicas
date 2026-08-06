import { supabase } from '@/lib/supabase'
import type {
  ActivityLog,
  AppNotification,
  NotificationType,
  Observation,
  Profile,
  Project,
  ProjectAccess,
  ProjectVersion,
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

/** Duplica un material como nuevo borrador del usuario actual. */
export async function duplicateProject(id: string): Promise<Project> {
  const source = await getProject(id)
  if (!source) throw new Error('Material no encontrado')
  return createProject({
    title: `${source.title} (copia)`,
    description: source.description ?? undefined,
    format: source.format,
    template_id: source.template_id,
    content: source.content,
    tags: source.tags,
  })
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

  // La justificación de una devolución/rechazo queda como observación en el hilo.
  if (note && (to === 'con_observaciones' || to === 'archivado')) {
    await addObservation(
      project.id,
      to === 'archivado' ? `Rechazado: ${note}` : note,
    ).catch(() => undefined)
  }

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
    (to === 'con_observaciones' ||
      to === 'aprobado' ||
      to === 'publicado' ||
      to === 'archivado') &&
    project.owner_id
  ) {
    const typeMap: Record<string, NotificationType> = {
      con_observaciones: 'observation_added',
      aprobado: 'approved',
      publicado: 'published',
      archivado: 'system',
    }
    const rejected = to === 'archivado' && Boolean(note)
    await createNotification({
      user_id: project.owner_id,
      type: typeMap[to],
      title: rejected
        ? 'Material rechazado'
        : `Material ${STATE_LABELS[to].toLowerCase()}`,
      body: rejected
        ? `«${project.title}» fue rechazado: ${note}`
        : `«${project.title}» cambió a estado ${STATE_LABELS[to]}.`,
      link: `/proyectos/${project.id}`,
    })
  }

  return updated
}

/* ----------------------------------------------------- Versiones */

export async function listVersions(
  projectId: string,
): Promise<ProjectVersion[]> {
  const { data, error } = await supabase
    .from('project_versions')
    .select('*, author:profiles (id, full_name, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProjectVersion[]
}

/** Crea una instantánea del proyecto en el historial de versiones. */
export async function createVersion(
  project: Pick<Project, 'id' | 'content' | 'status'>,
  note?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sin sesión activa')
  const { count } = await supabase
    .from('project_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project.id)
  const { error } = await supabase.from('project_versions').insert({
    project_id: project.id,
    version: (count ?? 0) + 1,
    content: project.content,
    status: project.status,
    note: note ?? null,
    created_by: user.id,
  })
  if (error) throw error
}

/** Restaura el contenido de una versión en el proyecto. */
export async function restoreVersion(
  projectId: string,
  version: ProjectVersion,
): Promise<Project> {
  // Guarda el estado actual antes de sobrescribir, para no perderlo.
  const current = await getProject(projectId)
  if (current)
    await createVersion(current, 'Autoguardado antes de restaurar').catch(
      () => undefined,
    )
  const updated = await updateProject(projectId, {
    content: version.content,
  })
  await logActivity({
    project_id: projectId,
    action: 'version_restored',
    meta: { version: version.version },
  })
  return updated
}

/* -------------------------------------------------------- Acceso / compartir */

export async function updateProjectAccess(
  id: string,
  access: ProjectAccess,
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ access })
    .eq('id', id)
  if (error) throw error
  await logActivity({ project_id: id, action: 'access_changed', meta: { access } })
}

/** Registra un evento de compartición para trazabilidad. */
export async function logShare(
  projectId: string,
  channel: string,
): Promise<void> {
  await logActivity({
    project_id: projectId,
    action: 'shared',
    meta: { channel },
  })
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

export async function listResources(
  championKit = false,
  category?: string,
): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (championKit) query = query.eq('is_champion_kit', true)
  if (category && category !== 'all') query = query.eq('category', category)
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

/* --------------------------------------------------------- Datos de prueba */

/**
 * Genera materiales de ejemplo del usuario actual, recorriendo el flujo
 * editorial completo, con versiones, observaciones y transferencias. Es
 * persistencia real (no simulada); pensado para poblar una unidad nueva.
 */
export async function generateSampleData(): Promise<{ created: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sin sesión activa')

  const specs: {
    title: string
    format: MaterialFormat
    target: ProjectState
    tags: string[]
  }[] = [
    { title: 'Prevención de LPP en hospitalización', format: 'infografia', target: 'publicado', tags: ['LPP', 'seguridad'] },
    { title: 'Bundle de accesos vasculares', format: 'checklist', target: 'aprobado', tags: ['accesos vasculares'] },
    { title: 'Valoración del dolor con EVA', format: 'boletin', target: 'pendiente_revision', tags: ['dolor'] },
    { title: 'Prevención de caídas del paciente', format: 'poster', target: 'con_observaciones', tags: ['caídas'] },
    { title: 'Kit Champion de higiene de manos', format: 'kit_champion', target: 'publicado', tags: ['higiene'] },
    { title: 'Flujograma de notificación de eventos', format: 'flujograma', target: 'en_edicion', tags: ['calidad'] },
    { title: 'Sesión: buenas prácticas clínicas', format: 'presentacion', target: 'borrador', tags: ['formación'] },
  ]

  let created = 0
  for (const spec of specs) {
    const project = await createProject({
      title: spec.title,
      format: spec.format,
      tags: spec.tags,
      description: 'Material de ejemplo generado para pruebas de la unidad.',
    })
    created += 1

    let current: Project = project
    const path: ProjectState[] = pathTo(spec.target)
    for (const step of path) {
      current = await transitionProject({
        project: current,
        to: step,
        reviewerId: step === 'pendiente_revision' ? user.id : undefined,
        note:
          step === 'con_observaciones'
            ? 'Ajustar terminología y añadir referencias.'
            : undefined,
      })
    }

    await createVersion(current, 'Versión inicial de ejemplo').catch(
      () => undefined,
    )

    if (spec.target === 'publicado') {
      await createTransferRecord({
        project_id: project.id,
        channel: 'Sesión presencial',
        audience: 'Enfermería',
        reach: 24,
        notes: 'Difusión en reunión de servicio.',
      }).catch(() => undefined)
    }
  }

  return { created }
}

/** Secuencia de transiciones desde borrador hasta el estado objetivo. */
function pathTo(target: ProjectState): ProjectState[] {
  const full: ProjectState[] = [
    'en_edicion',
    'pendiente_revision',
    'aprobado',
    'publicado',
  ]
  switch (target) {
    case 'borrador':
      return []
    case 'en_edicion':
      return ['en_edicion']
    case 'pendiente_revision':
      return ['en_edicion', 'pendiente_revision']
    case 'con_observaciones':
      return ['en_edicion', 'pendiente_revision', 'con_observaciones']
    case 'aprobado':
      return ['en_edicion', 'pendiente_revision', 'aprobado']
    case 'publicado':
      return full
    default:
      return []
  }
}
