/**
 * Modelo de dominio de NEX Studio.
 *
 * Fuente única de verdad para roles, estados del flujo editorial, formatos de
 * material y transiciones permitidas. Tanto la UI como las políticas de negocio
 * del cliente se apoyan en estas definiciones. La base de datos (Supabase)
 * replica los mismos enums en `supabase/migrations`.
 */

/* ------------------------------------------------------------------ Roles */

/**
 * NEX Studio opera con dos perfiles reales de la UBPC. La revisión está
 * integrada en el Coordinador. Los perfiles Champion, Revisor y Visualizador
 * se retiraron del uso (el enum de base de datos conserva sus valores por
 * compatibilidad, pero la aplicación solo usa estos dos).
 */
export const ROLES = ['coordinador', 'profesional_ubpc'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  coordinador: 'Coordinador UBPC',
  profesional_ubpc: 'Profesional UBPC',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  coordinador:
    'Acceso total: administración, creación, revisión, aprobación, publicación, archivo, códigos, transferencias, trazabilidad e indicadores.',
  profesional_ubpc:
    'Crea, edita, duplica y organiza proyectos; usa plantillas y Kit Champion; registra transferencias; envía a revisión y corrige observaciones; descarga y comparte materiales aprobados.',
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
  pendiente_revision: ['con_observaciones', 'aprobado', 'archivado', 'en_edicion'],
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
  'pendiente_revision->con_observaciones': 'Solicitar cambios',
  'pendiente_revision->aprobado': 'Aprobar',
  'pendiente_revision->archivado': 'Rechazar',
  'con_observaciones->en_edicion': 'Corregir',
  'vencido->en_edicion': 'Corregir',
  'aprobado->publicado': 'Publicar',
  'publicado->archivado': 'Archivar',
  'aprobado->en_edicion': 'Reabrir edición',
  'archivado->borrador': 'Restaurar',
}

/* --------------------------------------------------------------- Formatos */

export const FORMATS = [
  'presentacion',
  'infografia',
  'triptico',
  'kit_champion',
  'checklist',
  'boletin',
  'video_guion',
  'poster',
  'ficha_tecnica',
  'flujograma',
  'mapa_mental',
  'reloj_posicion',
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
    id: 'presentacion',
    label: 'Presentación',
    description: 'Diapositivas para sesiones y capacitaciones.',
    icon: 'MonitorPlay',
    ratio: '16 / 9',
  },
  {
    id: 'infografia',
    label: 'Infografía',
    description: 'Pieza vertical con bloques, gráficos y referencias.',
    icon: 'ChartNoAxesGantt',
    ratio: '4 / 7',
  },
  {
    id: 'triptico',
    label: 'Tríptico / Díptico',
    description: 'Folleto plegable con caras, paneles y pliegues.',
    icon: 'BookOpen',
    ratio: '1.414 / 1',
  },
  {
    id: 'kit_champion',
    label: 'Kit Champion',
    description: 'Paquete: portada, cápsula, tarjeta, afiche, checklist y más.',
    icon: 'Sparkles',
    ratio: '1 / 1',
  },
  {
    id: 'checklist',
    label: 'Lista de verificación',
    description: 'Secciones, criterios Sí/No/N.A., observaciones y firma.',
    icon: 'ListChecks',
    ratio: '1 / 1.414',
  },
  {
    id: 'boletin',
    label: 'Boletín EVI',
    description: 'Evidencia: autores, estudio, hallazgo, mensaje y QR.',
    icon: 'Newspaper',
    ratio: '1 / 1.414',
  },
  {
    id: 'video_guion',
    label: 'Cápsula',
    description: 'Pieza de lectura rápida en formato cuadrado.',
    icon: 'Clapperboard',
    ratio: '1 / 1',
  },
  {
    id: 'poster',
    label: 'Afiche',
    description: 'Pieza mural para servicios y consultorios.',
    icon: 'Image',
    ratio: '3 / 4',
  },
  {
    id: 'ficha_tecnica',
    label: 'Tarjeta / Ficha',
    description: 'Ficha breve de referencia rápida e impresión.',
    icon: 'FileText',
    ratio: '1.586 / 1',
  },
  {
    id: 'flujograma',
    label: 'Flujograma',
    description: 'Nodos, decisiones, conectores y alineación.',
    icon: 'Workflow',
    ratio: '4 / 3',
  },
  {
    id: 'mapa_mental',
    label: 'Mapa mental',
    description: 'Nodo central, ramas y conectores.',
    icon: 'Network',
    ratio: '16 / 10',
  },
  {
    id: 'reloj_posicion',
    label: 'Reloj de posición',
    description: 'Rueda de roles y posiciones por sectores.',
    icon: 'Clock',
    ratio: '1 / 1',
  },
  {
    id: 'documento',
    label: 'Documento',
    description: 'Protocolo o documento personalizado.',
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
  // Ambos perfiles crean materiales.
  canCreateMaterial: (r: Role) =>
    r === 'coordinador' || r === 'profesional_ubpc',
  // Revisión, aprobación, publicación y administración: solo Coordinador.
  canReview: (r: Role) => r === 'coordinador',
  canApprove: (r: Role) => r === 'coordinador',
  canPublish: (r: Role) => r === 'coordinador',
  canManageUsers: (r: Role) => r === 'coordinador',
  canManageTemplates: (r: Role) => r === 'coordinador',
  canViewProduction: (r: Role) => r === 'coordinador',
  // El Kit Champion lo usan ambos perfiles.
  canAccessChampionKit: (r: Role) =>
    r === 'coordinador' || r === 'profesional_ubpc',
} as const

export function transitionLabel(
  from: ProjectState,
  to: ProjectState,
): string {
  return (
    TRANSITION_ACTIONS[`${from}->${to}`] ?? `Marcar como ${STATE_LABELS[to]}`
  )
}
