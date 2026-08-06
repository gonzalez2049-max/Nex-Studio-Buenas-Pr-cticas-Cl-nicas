/**
 * Datos demo de NEX Studio.
 *
 * Se usan como respaldo cuando Supabase no está configurado, para que todas las
 * pantallas puedan evaluarse con contenido realista. No sustituyen a la
 * persistencia real: cuando hay Supabase, las consultas usan la API.
 */
import type {
  ActivityLog,
  AppNotification,
  Observation,
  Profile,
  ProjectVersion,
  ProjectWithRelations,
  Resource,
  TransferRecord,
} from '@/types/database'
import type { MaterialFormat, ProjectState } from '@/lib/domain'
import { STATE_LABELS } from '@/lib/domain'
import { getFormatDef } from '@/editor/formats'
import type { ProjectFilters } from '@/lib/api'
import type { DashboardMetrics } from '@/lib/api'

const now = Date.now()
const iso = (daysAgo: number) =>
  new Date(now - daysAgo * 86_400_000).toISOString()

/* --------------------------------------------------------------- Perfiles */

export const DEMO_PROFILES: Profile[] = [
  { id: 'p-admin', email: 'coordinacion@ubpc.org', full_name: 'Dra. Elena Ríos', avatar_url: null, role: 'coordinador', unit: 'UBPC · Dirección', job_title: 'Coordinadora UBPC', created_at: iso(120), updated_at: iso(2) },
  { id: 'p-coord', email: 'coord@ubpc.org', full_name: 'Dr. Marco Salas', avatar_url: null, role: 'coordinador', unit: 'UBPC · Medicina Interna', job_title: 'Coordinador UBPC', created_at: iso(110), updated_at: iso(3) },
  { id: 'p-prof', email: 'prof@ubpc.org', full_name: 'Lic. Ana Pérez', avatar_url: null, role: 'profesional_ubpc', unit: 'UBPC · Enfermería', job_title: 'Profesional de enfermería', created_at: iso(90), updated_at: iso(1) },
  { id: 'p-champ', email: 'julia.mora@ubpc.org', full_name: 'Enf. Julia Mora', avatar_url: null, role: 'profesional_ubpc', unit: 'UBPC · UCI', job_title: 'Profesional UBPC', created_at: iso(80), updated_at: iso(5) },
  { id: 'p-rev', email: 'ivan.castro@ubpc.org', full_name: 'Dr. Iván Castro', avatar_url: null, role: 'coordinador', unit: 'UBPC · Calidad', job_title: 'Coordinador UBPC', created_at: iso(70), updated_at: iso(4) },
  { id: 'p-view', email: 'pablo.nunez@ubpc.org', full_name: 'Sr. Pablo Núñez', avatar_url: null, role: 'profesional_ubpc', unit: 'UBPC · Docencia', job_title: 'Profesional UBPC', created_at: iso(60), updated_at: iso(6) },
]

const byId = (id: string) => DEMO_PROFILES.find((p) => p.id === id) ?? null
const mini = (id: string) => {
  const p = byId(id)
  return p ? { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, role: p.role } : null
}

/* --------------------------------------------------------------- Proyectos */

interface Spec {
  id: string
  code: string
  title: string
  description: string
  format: MaterialFormat
  status: ProjectState
  owner: string
  reviewer?: string
  tags: string[]
  updated: number
  withContent?: boolean
  expires?: number
}

const SPECS: Spec[] = [
  { id: 'd1', code: 'UBPC-INFO-2026-0001', title: 'Prevención de lesiones por presión (LPP)', description: 'Infografía con la escala de Braden y el paquete de medidas de prevención.', format: 'infografia', status: 'publicado', owner: 'p-prof', reviewer: 'p-rev', tags: ['LPP', 'seguridad'], updated: 1, withContent: true, expires: -20 },
  { id: 'd2', code: 'UBPC-CHK-2026-0002', title: 'Checklist de mantenimiento de accesos vasculares', description: 'Lista de verificación del bundle de catéter venoso central.', format: 'checklist', status: 'pendiente_revision', owner: 'p-prof', reviewer: 'p-rev', tags: ['accesos vasculares'], updated: 0, withContent: true },
  { id: 'd3', code: 'UBPC-EVI-2026-0003', title: 'Boletín EVI: manejo del dolor agudo', description: 'Síntesis de evidencia sobre valoración y manejo del dolor.', format: 'boletin', status: 'con_observaciones', owner: 'p-champ', reviewer: 'p-rev', tags: ['dolor'], updated: 2, withContent: true },
  { id: 'd4', code: 'UBPC-AFI-2026-0004', title: 'Afiche: prevención de caídas', description: 'Pieza mural para señalización del riesgo de caídas.', format: 'poster', status: 'aprobado', owner: 'p-prof', reviewer: 'p-rev', tags: ['caídas'], updated: 3 },
  { id: 'd5', code: 'UBPC-KIT-2026-0005', title: 'Kit Champion de higiene de manos', description: 'Paquete completo para impulsar la higiene de manos.', format: 'kit_champion', status: 'publicado', owner: 'p-champ', tags: ['higiene'], updated: 4, expires: -60 },
  { id: 'd6', code: 'UBPC-FLU-2026-0006', title: 'Flujograma de notificación de eventos adversos', description: 'Ruta de notificación y análisis de eventos.', format: 'flujograma', status: 'en_edicion', owner: 'p-prof', tags: ['calidad'], updated: 0, withContent: true },
  { id: 'd7', code: 'UBPC-PRES-2026-0007', title: 'Sesión: buenas prácticas clínicas 2026', description: 'Diapositivas para la capacitación anual.', format: 'presentacion', status: 'borrador', owner: 'p-prof', tags: ['formación'], updated: 1, withContent: true },
  { id: 'd8', code: 'UBPC-TRIP-2026-0008', title: 'Tríptico informativo para pacientes', description: 'Folleto con recomendaciones al alta.', format: 'triptico', status: 'pendiente_revision', owner: 'p-champ', reviewer: 'p-rev', tags: ['pacientes'], updated: 2 },
  { id: 'd9', code: 'UBPC-FICHA-2026-0009', title: 'Ficha rápida: escala EVA del dolor', description: 'Tarjeta de bolsillo para valoración del dolor.', format: 'ficha_tecnica', status: 'archivado', owner: 'p-prof', tags: ['dolor'], updated: 30 },
]

function content(spec: Spec): Record<string, unknown> {
  if (!spec.withContent) return {}
  try {
    return getFormatDef(spec.format).createDocument() as unknown as Record<string, unknown>
  } catch {
    return {}
  }
}

export const DEMO_PROJECTS: ProjectWithRelations[] = SPECS.map((s) => ({
  id: s.id,
  code: s.code,
  title: s.title,
  description: s.description,
  format: s.format,
  status: s.status,
  access: 'privado',
  template_id: null,
  content: content(s),
  owner_id: s.owner,
  assigned_reviewer_id: s.reviewer ?? null,
  thumbnail_url: null,
  tags: s.tags,
  version: 1,
  published_at: s.status === 'publicado' ? iso(s.updated) : null,
  expires_at: s.expires != null ? iso(s.expires) : null,
  created_at: iso(s.updated + 10),
  updated_at: iso(s.updated),
  owner: mini(s.owner),
  reviewer: s.reviewer ? { id: s.reviewer, full_name: byId(s.reviewer)?.full_name ?? null, avatar_url: null } : null,
  template: null,
}))

export function listProjects(filters: ProjectFilters = {}): ProjectWithRelations[] {
  let list = [...DEMO_PROJECTS]
  if (filters.status && filters.status !== 'all') list = list.filter((p) => p.status === filters.status)
  if (filters.format && filters.format !== 'all') list = list.filter((p) => p.format === filters.format)
  if (filters.ownerId) list = list.filter((p) => p.owner_id === filters.ownerId)
  if (filters.search) list = list.filter((p) => p.title.toLowerCase().includes(filters.search!.toLowerCase()))
  return list.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
}

export function getProject(id: string): ProjectWithRelations | null {
  return DEMO_PROJECTS.find((p) => p.id === id) ?? null
}

/* ----------------------------------------------------------- Observaciones */

const OBS: Record<string, { author: string; body: string; days: number; resolved?: boolean }[]> = {
  d2: [
    { author: 'p-rev', body: '[Página 1] Verificar que la secuencia del bundle siga el orden institucional.', days: 0 },
    { author: 'p-prof', body: 'Ajustado el orden según la guía. Queda pendiente la referencia.', days: 0 },
  ],
  d3: [
    { author: 'p-rev', body: 'Rechazado: falta la fuente del hallazgo principal y la fecha del estudio.', days: 2 },
    { author: 'p-rev', body: '[Elemento: mensaje clave] Reformular para lenguaje más claro al personal.', days: 2, resolved: true },
  ],
  d8: [
    { author: 'p-rev', body: '[Panel 2] Revisar el contraste del texto sobre el fondo.', days: 1 },
  ],
}

export function listObservations(projectId: string): Observation[] {
  return (OBS[projectId] ?? []).map((o, i) => ({
    id: `${projectId}-obs-${i}`,
    project_id: projectId,
    author_id: o.author,
    body: o.body,
    resolved: o.resolved ?? false,
    created_at: iso(o.days),
    author: mini(o.author),
  }))
}

/* -------------------------------------------------------------- Actividad */

export function listActivity(limit = 15): ActivityLog[] {
  const items: ActivityLog[] = [
    { id: 'a1', project_id: 'd2', actor_id: 'p-prof', action: 'status_change', from_status: 'en_edicion', to_status: 'pendiente_revision', meta: null, created_at: iso(0), actor: mini('p-prof') },
    { id: 'a2', project_id: 'd3', actor_id: 'p-rev', action: 'status_change', from_status: 'pendiente_revision', to_status: 'con_observaciones', meta: { note: 'Faltan referencias' }, created_at: iso(2), actor: mini('p-rev') },
    { id: 'a3', project_id: 'd4', actor_id: 'p-coord', action: 'status_change', from_status: 'pendiente_revision', to_status: 'aprobado', meta: null, created_at: iso(3), actor: mini('p-coord') },
    { id: 'a4', project_id: 'd1', actor_id: 'p-coord', action: 'status_change', from_status: 'aprobado', to_status: 'publicado', meta: null, created_at: iso(1), actor: mini('p-coord') },
    { id: 'a5', project_id: 'd5', actor_id: 'p-champ', action: 'shared', from_status: null, to_status: null, meta: { channel: 'correo' }, created_at: iso(4), actor: mini('p-champ') },
    { id: 'a6', project_id: 'd7', actor_id: 'p-prof', action: 'created', from_status: null, to_status: 'borrador', meta: null, created_at: iso(1), actor: mini('p-prof') },
  ]
  return items.slice(0, limit)
}

export function projectActivity(projectId: string): ActivityLog[] {
  return listActivity(99).filter((a) => a.project_id === projectId)
}

/* ------------------------------------------------------------ Transferencia */

export const DEMO_TRANSFERS: TransferRecord[] = [
  { id: 't1', project_id: 'd1', channel: 'Sesión presencial', audience: 'Enfermería · LPP', reach: 32, transferred_by: 'p-prof', transferred_at: iso(2), notes: 'Actividad: taller de reposicionamiento · Responsable: Ana Pérez · Resultado: 100% asistencia · Evidencia: lista de firmas · Validación: Coordinación', project: { id: 'd1', title: 'Prevención de lesiones por presión (LPP)', format: 'infografia' } },
  { id: 't2', project_id: 'd5', channel: 'Intranet', audience: 'Toda la unidad · Higiene', reach: 120, transferred_by: 'p-champ', transferred_at: iso(5), notes: 'Actividad: campaña mensual · Responsable: Julia Mora · Resultado: alcance amplio · Evidencia: analítica intranet · Validación: Dirección', project: { id: 'd5', title: 'Kit Champion de higiene de manos', format: 'kit_champion' } },
  { id: 't3', project_id: 'd1', channel: 'Cartelera física', audience: 'Hospitalización', reach: 60, transferred_by: 'p-champ', transferred_at: iso(8), notes: 'Actividad: colocación de afiches · Responsable: Julia Mora · Resultado: cobertura de 3 servicios · Evidencia: fotografías · Validación: Coordinación', project: { id: 'd1', title: 'Prevención de lesiones por presión (LPP)', format: 'infografia' } },
]

export function listTransferRecords(): TransferRecord[] {
  return [...DEMO_TRANSFERS].sort((a, b) => +new Date(b.transferred_at) - +new Date(a.transferred_at))
}

/* ------------------------------------------------------------ Notificaciones */

export function listNotifications(): AppNotification[] {
  return [
    { id: 'n1', user_id: 'me', type: 'review_requested', title: 'Nueva revisión asignada', body: 'Se te asignó revisar «Checklist de mantenimiento de accesos vasculares».', link: '/proyectos/d2', read: false, created_at: iso(0) },
    { id: 'n2', user_id: 'me', type: 'observation_added', title: 'Material con observaciones', body: '«Boletín EVI: manejo del dolor agudo» requiere correcciones.', link: '/proyectos/d3', read: false, created_at: iso(2) },
    { id: 'n3', user_id: 'me', type: 'published', title: 'Material publicado', body: '«Prevención de lesiones por presión (LPP)» fue publicado.', link: '/proyectos/d1', read: true, created_at: iso(1) },
  ]
}

/* ------------------------------------------------------------- Versiones */

export function listVersions(projectId: string): ProjectVersion[] {
  const p = getProject(projectId)
  if (!p) return []
  return [
    { id: `${projectId}-v2`, project_id: projectId, version: 2, content: p.content, status: p.status, note: 'Guardado manual', created_by: p.owner_id, created_at: iso(1), author: mini(p.owner_id) },
    { id: `${projectId}-v1`, project_id: projectId, version: 1, content: {}, status: 'borrador', note: 'Versión inicial', created_by: p.owner_id, created_at: iso(9), author: mini(p.owner_id) },
  ]
}

/* --------------------------------------------------------------- Recursos */

const RES: Omit<Resource, 'id' | 'created_at' | 'created_by'>[] = [
  { title: 'Kit LPP — Prevención de lesiones por presión', description: 'Paquete Champion para la prevención de LPP: cambios posturales y superficies.', kind: 'guia', category: 'LPP', is_champion_kit: true, url: null },
  { title: 'Escala de Braden — Tarjeta rápida', description: 'Tarjeta de bolsillo para valoración del riesgo de LPP.', kind: 'plantilla', category: 'LPP', is_champion_kit: true, url: null },
  { title: 'Afiche LPP — Reposiciona cada 2 horas', description: 'Afiche mural recordatorio de reposicionamiento.', kind: 'documento', category: 'LPP', is_champion_kit: true, url: null },
  { title: 'Kit Accesos vasculares — Mantenimiento seguro', description: 'Buenas prácticas en inserción y mantenimiento de accesos vasculares.', kind: 'guia', category: 'Accesos vasculares', is_champion_kit: true, url: null },
  { title: 'Checklist de curación de catéter', description: 'Lista de verificación editable para curación de accesos vasculares.', kind: 'documento', category: 'Accesos vasculares', is_champion_kit: true, url: null },
  { title: 'Cápsula — Bundle CVC', description: 'Cápsula formativa sobre el bundle de catéter venoso central.', kind: 'video', category: 'Accesos vasculares', is_champion_kit: true, url: null },
  { title: 'Kit Dolor — Valoración y manejo', description: 'Recursos Champion para la valoración sistemática del dolor.', kind: 'guia', category: 'Dolor', is_champion_kit: true, url: null },
  { title: 'Escala EVA — Tarjeta', description: 'Escala visual analógica del dolor para uso a pie de cama.', kind: 'plantilla', category: 'Dolor', is_champion_kit: true, url: null },
  { title: 'Kit Caídas — Prevención de caídas', description: 'Paquete Champion para la prevención de caídas del paciente.', kind: 'guia', category: 'Caídas', is_champion_kit: true, url: null },
  { title: 'Afiche Caídas — Identifica el riesgo', description: 'Afiche de señalización del riesgo de caídas.', kind: 'documento', category: 'Caídas', is_champion_kit: true, url: null },
  { title: 'Guía de Buenas Prácticas Clínicas (ICH-GCP)', description: 'Referencia normativa internacional.', kind: 'norma', category: 'Normativa', is_champion_kit: false, url: null },
  { title: 'Manual de identidad visual UBPC', description: 'Colores, tipografías y uso del logotipo.', kind: 'guia', category: 'Marca', is_champion_kit: false, url: null },
]

export function listResources(championKit = false, category?: string): Resource[] {
  return RES.filter((r) => (championKit ? r.is_champion_kit : true))
    .filter((r) => !category || category === 'all' || r.category === category)
    .map((r, i) => ({ ...r, id: `res-${i}`, created_at: iso(20 + i), created_by: null }))
}

/* --------------------------------------------------------------- Métricas */

export function getDashboardMetrics(): DashboardMetrics {
  const byStatus = Object.fromEntries(
    Object.keys(STATE_LABELS).map((s) => [s, 0]),
  ) as Record<ProjectState, number>
  for (const p of DEMO_PROJECTS) byStatus[p.status] += 1
  return {
    total: DEMO_PROJECTS.length,
    byStatus,
    pendingReview: byStatus.pendiente_revision,
    published: byStatus.publicado,
    drafts: byStatus.borrador + byStatus.en_edicion,
    expiringSoon: 1,
  }
}

export function listProfiles(): Profile[] {
  return DEMO_PROFILES
}
