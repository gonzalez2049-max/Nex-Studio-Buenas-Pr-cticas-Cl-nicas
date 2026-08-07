/**
 * Ficha de cierre del producto.
 *
 * Tarjeta resumen que el Profesional genera al terminar un material, completa,
 * firma electrónicamente (registro textual, sin imagen) y envía al Coordinador.
 * Se guarda en el proyecto (`projects.closure`) como respaldo institucional.
 */
import type { ProjectState } from '@/lib/domain'
import { FORMAT_LABELS } from '@/lib/domain'
import type { Profile, ProjectWithRelations } from '@/types/database'

/** Firma electrónica: registro textual verificable, nunca una imagen. */
export interface ClosureSignature {
  name: string
  role: string
  /** Fecha y hora de la firma (ISO). */
  signed_at: string
  confirmed: boolean
}

export interface ClosureCard {
  product_name: string
  material_type: string
  created_at: string
  closed_at: string
  professional: string
  guide: string
  topics: string
  audience: string
  impacted: number
  unit: string
  code: string
  version: number
  status: ProjectState
  material_link: string
  observations: string
  signature: ClosureSignature | null
  /** Fecha y hora de envío al Coordinador (ISO). */
  sent_at: string | null
}

/** Lee la ficha del proyecto; en modo demo usa un respaldo local. */
export function loadClosure(project: ProjectWithRelations): ClosureCard | null {
  if (project.closure) return project.closure as unknown as ClosureCard
  try {
    const raw = localStorage.getItem(closureKey(project.id))
    if (raw) return JSON.parse(raw) as ClosureCard
  } catch {
    /* noop */
  }
  return null
}

export function closureKey(projectId: string): string {
  return `nex-closure-${projectId}`
}

export function persistClosureLocal(projectId: string, card: ClosureCard) {
  try {
    localStorage.setItem(closureKey(projectId), JSON.stringify(card))
  } catch {
    /* noop */
  }
}

/** Genera automáticamente la ficha a partir de los datos del proyecto. */
export function buildClosureFromProject(
  project: ProjectWithRelations,
  profile?: Profile | null,
): ClosureCard {
  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/proyectos/${project.id}`
      : `/proyectos/${project.id}`
  return {
    product_name: project.title,
    material_type: FORMAT_LABELS[project.format],
    created_at: project.created_at,
    closed_at: new Date().toISOString(),
    professional: profile?.full_name ?? project.owner?.full_name ?? '',
    guide: project.tags[0] ?? '',
    topics: project.tags.join(', '),
    audience: '',
    impacted: 0,
    unit: profile?.unit ?? '',
    code: project.code ?? '',
    version: project.version,
    status: project.status,
    material_link: link,
    observations: project.description ?? '',
    signature: null,
    sent_at: null,
  }
}

/** ¿La ficha tiene los datos mínimos para poder firmarse? */
export function closureReadyToSign(c: ClosureCard): boolean {
  return Boolean(c.product_name && c.topics.trim() && c.audience.trim() && c.impacted >= 0)
}
