/**
 * Espacios educativos (líneas temáticas) de NEX Studio.
 *
 * Cada espacio ofrece TODOS los formatos de creación; el tema seleccionado se
 * vincula automáticamente al material (etiqueta) y adapta la plantilla base.
 * La lista es extensible: añadir una nueva línea aquí la habilita en todo el
 * flujo sin bloquear ningún formato.
 */
import type { EditorDocument, EditorElement } from '@/editor/model'

export interface EduTheme {
  id: string
  label: string
  short: string
  color: string
  icon: string
}

export const THEMES: EduTheme[] = [
  { id: 'LPP', label: 'Lesiones por presión (LPP)', short: 'LPP', color: '#0ea5e9', icon: 'ShieldCheck' },
  { id: 'Accesos vasculares', label: 'Accesos vasculares', short: 'Accesos', color: '#14b8a6', icon: 'Syringe' },
  { id: 'Dolor', label: 'Dolor', short: 'Dolor', color: '#fb7185', icon: 'Activity' },
  { id: 'Caídas', label: 'Caídas', short: 'Caídas', color: '#f59e0b', icon: 'TriangleAlert' },
  { id: 'Seguridad del paciente', label: 'Seguridad del paciente', short: 'Seguridad', color: '#8b5cf6', icon: 'ShieldHalf' },
  { id: 'Higiene de manos', label: 'Higiene de manos', short: 'Higiene', color: '#22c55e', icon: 'Hand' },
  { id: 'General', label: 'General (sin línea específica)', short: 'General', color: '#64748b', icon: 'LayoutGrid' },
]

export function findTheme(id: string | null | undefined): EduTheme | undefined {
  if (!id) return undefined
  return THEMES.find((t) => t.id.toLowerCase() === id.toLowerCase())
}

/**
 * Adapta el documento base a la temática: escribe el tema en el primer
 * antetítulo/título. No altera la estructura del formato.
 */
export function applyThemeToDoc(
  doc: EditorDocument,
  theme: EduTheme,
): EditorDocument {
  if (theme.id === 'General') return doc
  const clone = JSON.parse(JSON.stringify(doc)) as EditorDocument
  const first = clone.pages[0]
  if (!first) return clone
  const texts = first.elements.filter(
    (e): e is Extract<EditorElement, { kind: 'text' }> => e.kind === 'text',
  )
  // Antetítulo: el primer texto pequeño en mayúsculas o en color de marca.
  const eyebrow = texts.find((t) => t.fontSize <= 20)
  if (eyebrow) eyebrow.text = theme.label.toUpperCase()
  // Título: el primer texto grande.
  const heading = texts.find((t) => t.fontSize >= 26)
  if (heading && /t[ií]tulo|nombre|idea|mensaje/i.test(heading.text)) {
    heading.text = `${theme.short} · ${heading.text}`
  }
  return clone
}
