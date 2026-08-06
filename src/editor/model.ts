/**
 * Modelo de documento del editor de NEX Studio.
 *
 * Un documento es una lista de páginas; cada página tiene su tamaño (heredado
 * del formato o propio, p. ej. en un Kit Champion) y una lista de elementos
 * editables. Todo se guarda como JSON en `projects.content`, de modo que el
 * diseño nunca se aplana a imagen: siempre permanece editable.
 */
import type { MaterialFormat } from '@/lib/domain'

export type ElementKind =
  | 'text'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'image'
  | 'table'
  | 'chart'

export interface Shadow {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export interface BaseElement {
  id: string
  kind: ElementKind
  name?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  /** Elementos con el mismo groupId se seleccionan y mueven en conjunto. */
  groupId?: string | null
}

export interface TextElement extends BaseElement {
  kind: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontStyle: '' | 'bold' | 'italic' | 'bold italic'
  textDecoration: '' | 'underline'
  align: 'left' | 'center' | 'right'
  fill: string
  lineHeight: number
}

export interface ShapeCommon {
  fill: string
  stroke: string
  strokeWidth: number
  shadow: Shadow
}

export interface RectElement extends BaseElement, ShapeCommon {
  kind: 'rect'
  cornerRadius: number
}

export interface EllipseElement extends BaseElement, ShapeCommon {
  kind: 'ellipse'
}

export interface LineElement extends BaseElement {
  kind: 'line'
  /** Puntos relativos al origen del elemento: [x1,y1,x2,y2,...]. */
  points: number[]
  stroke: string
  strokeWidth: number
  arrowStart: boolean
  arrowEnd: boolean
  dashed: boolean
}

export interface ImageElement extends BaseElement {
  kind: 'image'
  src: string
  cornerRadius: number
  /** Marca el subtipo para la interfaz (icono, logo, QR, foto…). */
  subtype?: 'image' | 'icon' | 'logo' | 'qr'
}

export interface TableElement extends BaseElement {
  kind: 'table'
  rows: number
  cols: number
  cells: string[][]
  fontSize: number
  textColor: string
  headerFill: string
  headerTextColor: string
  borderColor: string
}

export interface ChartDatum {
  label: string
  value: number
}

export interface ChartElement extends BaseElement {
  kind: 'chart'
  chartType: 'bar' | 'line' | 'pie'
  data: ChartDatum[]
  palette: string[]
  title: string
}

export type EditorElement =
  | TextElement
  | RectElement
  | EllipseElement
  | LineElement
  | ImageElement
  | TableElement
  | ChartElement

export interface Page {
  id: string
  name: string
  background: string
  /** Etiqueta estructural (diapositiva, panel, cara, componente del kit…). */
  kind?: string
  /** Tamaño propio; si falta, usa el del documento. */
  width?: number
  height?: number
  /** Guías de pliegue verticales (fracciones 0-1) para trípticos/dípticos. */
  folds?: number[]
  elements: EditorElement[]
}

export interface EditorDocument {
  schema: 1
  format: MaterialFormat
  /** Tamaño por defecto de las páginas, en px @96dpi. */
  pageSize: { width: number; height: number }
  /** Margen de seguridad en px, para guías. */
  margin: number
  pages: Page[]
}

export function isShapeElement(
  el: EditorElement,
): el is RectElement | EllipseElement {
  return el.kind === 'rect' || el.kind === 'ellipse'
}

export function pageWidth(doc: EditorDocument, page: Page): number {
  return page.width ?? doc.pageSize.width
}

export function pageHeight(doc: EditorDocument, page: Page): number {
  return page.height ?? doc.pageSize.height
}

let counter = 0
export function uid(prefix = 'el'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

export const defaultShadow = (): Shadow => ({
  enabled: false,
  color: '#0f172a',
  blur: 12,
  offsetX: 0,
  offsetY: 6,
})
