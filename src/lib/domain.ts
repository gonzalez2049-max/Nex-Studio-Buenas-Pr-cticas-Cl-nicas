/**
 * Modelo de dominio de NEX Studio.
 *
 * Fuente única de verdad para roles, estados del flujo editorial, formatos de
 * material y transiciones permitidas. Tanto la UI como las políticas de negocio
 * del cliente se apoyan en estas definiciones. La base de datos (Supabase)
 * replica los mismos enums en `supabase/migrations`.
 */

/* ------------------------------------------------------------------ Roles */

export const ROLES = [
  'admin_ubpc',
  'coordinador',
  'profesional_ubpc',
  'champion',
  'revisor',
  'visualizador',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin_ubpc: 'Administrador UBPC',
  coordinador: 'Coordinador',
  profesional_ubpc: 'Profesional UBPC',
  champion: 'Champion',
  revisor: 'Revisor',
  visualizador: 'Visualizador',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin_ubpc:
    'Control total de la plataforma: usuarios, roles, plantillas oficiales, producción UBPC y configuración institucional.',
  coordinador:
    'Coordina la producción de su unidad, asigna revisores, aprueba y publica materiales.',
  profesional_ubpc:
    'Crea y edita materiales de transferencia del conocimiento y los envía a revisión.',
  champion:
    'Impulsa la adopción; accede al Kit Champion y difunde materiales publicados.',
  revisor:
    'Revisa materiales pendientes, deja observaciones y aprueba o devuelve para corrección.',
  visualizador:
    'Consulta y descarga materiales publicados. Sin permisos de edición.',
}

/* ---------------------------------------------------------------- Estados */

export const PROJECT_STATES = [
  'borrador',
  'en_edicion',
  'pendiente_revision',
  'con_observaciones',
  'aprobado',
  'publicado',
  'archivado',
  'vencido',
] as const

export type ProjectState = (typeof PROJECT_STATES)[number]

export const STATE_LABELS: Record<ProjectState, string> = {
  borrador: 'Borrador',
  en_edicion: 'En edición',
  pendiente_revision: 'Pendiente de revisión',
  con_observaciones: 'Con observaciones',
  aprobado: 'Aprobado',
  publicado: 'Publicado',
  archivado: 'Archivado',
  vencido: 'Vencido',
}

/** Clases Tailwind para el badge de cada estado (claro/oscuro). */
export const STATE_BADGE: Record<ProjectState, string> = {
  borrador:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  en_edicion:
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  pendiente_revision:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  con_observaciones:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  aprobado:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  publicado:
    'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  archivado:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  vencido: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

/**
 * Transiciones válidas del flujo editorial obligatorio:
 * seleccionar formato → plantilla/desde cero → editar → guardar →
 * vista previa → enviar a revisión → observaciones → corregir →
 * aprobar → publicar → compartir / descargar.
 */
export const STATE_TRANSITIONS: Record<ProjectState, ProjectState[]> = {
  borrador: ['en_edicion', 'archivado'],
  en_edicion: ['pendiente_revision', 'borrador', 'archivado'],
  pendiente_revision: ['con_observaciones', 'aprobado', 'en_edicion'],
  con_observaciones: ['en_edicion', 'archivado'],
  aprobado: ['publicado', 'en_edicion', 'archivado'],
  publicado: ['archivado', 'vencido'],
  archivado: ['borrador'],
  vencido: ['en_edicion', 'archivado'],
}

export function canTransition(from: ProjectState, to: ProjectState): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false
}

/** Etiqueta de la acción que produce una transición (para botones). */
export const TRANSITION_ACTIONS: Partial<
  Record<`${ProjectState}->${ProjectState}`, string>
> = {
  'borrador->en_edicion': 'Continuar edición',
  'en_edicion->pendiente_revision': 'Enviar a revisión',
  'pendiente_revision->con_observaciones': 'Devolver con observaciones',
  'pendiente_revision->aprobado': 'Aprobar',
  'con_observaciones->en_edicion': 'Corregir',
  'vencido->en_edicion': 'Corregir',
  'aprobado->publicado': 'Publicar',
  'publicado->archivado': 'Archivar',
  'aprobado->en_edicion': 'Reabrir edición',
  'archivado->borrador': 'Restaurar',
}

/* --------------------------------------------------------------- Formatos */

export const FORMATS = [
  'infografia',
  'poster',
  'presentacion',
  'ficha_tecnica',
  'boletin',
  'video_guion',
  'checklist',
  'documento',
] as const

export type MaterialFormat = (typeof FORMATS)[number]

export interface FormatDef {
  id: MaterialFormat
  label: string
  description: string
  /** Icono lucide-react por nombre. */
  icon: string
  /** Relación de aspecto sugerida del lienzo. */
  ratio: string
}

export const FORMAT_DEFS: FormatDef[] = [
  {
    id: 'infografia',
    label: 'Infografía',
    description: 'Resumen visual de un proceso o guía clínica.',
    icon: 'ChartNoAxesGantt',
    ratio: '4 / 5',
  },
  {
    id: 'poster',
    label: 'Póster',
    description: 'Pieza mural para servicios y consultorios.',
    icon: 'Image',
    ratio: '3 / 4',
  },
  {
    id: 'presentacion',
    label: 'Presentación',
    description: 'Diapositivas para sesiones y capacitaciones.',
    icon: 'MonitorPlay',
    ratio: '16 / 9',
  },
  {
    id: 'ficha_tecnica',
    label: 'Ficha técnica',
    description: 'Documento breve de referencia rápida.',
    icon: 'FileText',
    ratio: '1 / 1.414',
  },
  {
    id: 'boletin',
    label: 'Boletín',
    description: 'Comunicado periódico de la unidad.',
    icon: 'Newspaper',
    ratio: '1 / 1.414',
  },
  {
    id: 'video_guion',
    label: 'Guion de video',
    description: 'Escaleta y guion para píldoras formativas.',
    icon: 'Clapperboard',
    ratio: '16 / 9',
  },
  {
    id: 'checklist',
    label: 'Lista de verificación',
    description: 'Checklist operativa de buenas prácticas.',
    icon: 'ListChecks',
    ratio: '1 / 1.414',
  },
  {
    id: 'documento',
    label: 'Documento',
    description: 'Protocolo o procedimiento normalizado.',
    icon: 'FileType2',
    ratio: '1 / 1.414',
  },
]

export const FORMAT_LABELS: Record<MaterialFormat, string> = Object.fromEntries(
  FORMAT_DEFS.map((f) => [f.id, f.label]),
) as Record<MaterialFormat, string>

/* ------------------------------------------------- Permisos (cliente) */

/**
 * Comprobaciones de permisos usadas por la UI. La seguridad real vive en las
 * políticas RLS de Supabase; esto solo decide qué mostrar/habilitar.
 */
export const PERMISSIONS = {
  canCreateMaterial: (r: Role) =>
    ['admin_ubpc', 'coordinador', 'profesional_ubpc'].includes(r),
  canReview: (r: Role) => ['admin_ubpc', 'coordinador', 'revisor'].includes(r),
  canApprove: (r: Role) => ['admin_ubpc', 'coordinador'].includes(r),
  canPublish: (r: Role) => ['admin_ubpc', 'coordinador'].includes(r),
  canManageUsers: (r: Role) => r === 'admin_ubpc',
  canManageTemplates: (r: Role) => ['admin_ubpc', 'coordinador'].includes(r),
  canAccessChampionKit: (r: Role) =>
    ['admin_ubpc', 'coordinador', 'champion'].includes(r),
  canViewProduction: (r: Role) => ['admin_ubpc', 'coordinador'].includes(r),
} as const

export function transitionLabel(
  from: ProjectState,
  to: ProjectState,
): string {
  return (
    TRANSITION_ACTIONS[`${from}->${to}`] ?? `Marcar como ${STATE_LABELS[to]}`
  )
}
