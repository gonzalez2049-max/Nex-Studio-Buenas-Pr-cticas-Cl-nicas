import {
  defaultShadow,
  uid,
  type ChartElement,
  type EditorElement,
  type EllipseElement,
  type ImageElement,
  type LineElement,
  type RectElement,
  type TableElement,
  type TextElement,
} from '@/editor/model'
import { iconDataUrl, logoDataUrl, qrDataUrl } from '@/editor/assets'

const BRAND = '#0d9488'

export function makeText(patch: Partial<TextElement> = {}): TextElement {
  return {
    id: uid('txt'),
    kind: 'text',
    name: 'Texto',
    x: 80,
    y: 80,
    width: 360,
    height: 60,
    rotation: 0,
    opacity: 1,
    locked: false,
    text: 'Escribe aquí',
    fontSize: 28,
    fontFamily: 'Inter',
    fontStyle: '',
    textDecoration: '',
    align: 'left',
    fill: '#0f172a',
    lineHeight: 1.3,
    ...patch,
  }
}

export function makeHeading(text: string, patch: Partial<TextElement> = {}) {
  return makeText({
    text,
    fontSize: 44,
    fontStyle: 'bold',
    height: 70,
    name: 'Título',
    ...patch,
  })
}

export function makeRect(patch: Partial<RectElement> = {}): RectElement {
  return {
    id: uid('rect'),
    kind: 'rect',
    name: 'Rectángulo',
    x: 100,
    y: 100,
    width: 240,
    height: 160,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: '#e2e8f0',
    stroke: '#94a3b8',
    strokeWidth: 0,
    cornerRadius: 12,
    shadow: defaultShadow(),
    ...patch,
  }
}

export function makeEllipse(patch: Partial<EllipseElement> = {}): EllipseElement {
  return {
    id: uid('ell'),
    kind: 'ellipse',
    name: 'Elipse',
    x: 120,
    y: 120,
    width: 180,
    height: 180,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: BRAND,
    stroke: '#0f766e',
    strokeWidth: 0,
    shadow: defaultShadow(),
    ...patch,
  }
}

export function makeLine(patch: Partial<LineElement> = {}): LineElement {
  return {
    id: uid('line'),
    kind: 'line',
    name: 'Conector',
    x: 120,
    y: 120,
    width: 200,
    height: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    points: [0, 0, 200, 0],
    stroke: '#334155',
    strokeWidth: 3,
    arrowStart: false,
    arrowEnd: true,
    dashed: false,
    ...patch,
  }
}

export function makeImage(src: string, patch: Partial<ImageElement> = {}): ImageElement {
  return {
    id: uid('img'),
    kind: 'image',
    name: 'Imagen',
    x: 100,
    y: 100,
    width: 260,
    height: 180,
    rotation: 0,
    opacity: 1,
    locked: false,
    src,
    cornerRadius: 0,
    subtype: 'image',
    ...patch,
  }
}

export function makeIcon(iconId: string, color = '#0f172a'): ImageElement {
  return makeImage(iconDataUrl(iconId, color), {
    name: 'Icono',
    width: 96,
    height: 96,
    subtype: 'icon',
  })
}

export function makeLogo(text = 'UBPC'): ImageElement {
  return makeImage(logoDataUrl(text, BRAND), {
    name: 'Logo',
    width: 160,
    height: 64,
    subtype: 'logo',
  })
}

export function makeQr(text = 'https://ubpc.org'): ImageElement {
  return makeImage(qrDataUrl(text), {
    name: 'Código QR',
    width: 140,
    height: 140,
    subtype: 'qr',
  })
}

export function makeTable(patch: Partial<TableElement> = {}): TableElement {
  const rows = patch.rows ?? 4
  const cols = patch.cols ?? 3
  const cells =
    patch.cells ??
    Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) =>
        r === 0 ? `Columna ${c + 1}` : '',
      ),
    )
  return {
    id: uid('tbl'),
    kind: 'table',
    name: 'Tabla',
    x: 80,
    y: 80,
    width: 480,
    height: 220,
    rotation: 0,
    opacity: 1,
    locked: false,
    rows,
    cols,
    cells,
    fontSize: 16,
    textColor: '#0f172a',
    headerFill: BRAND,
    headerTextColor: '#ffffff',
    borderColor: '#cbd5e1',
    ...patch,
  }
}

export function makeChart(patch: Partial<ChartElement> = {}): ChartElement {
  return {
    id: uid('cht'),
    kind: 'chart',
    name: 'Gráfico',
    x: 80,
    y: 80,
    width: 380,
    height: 260,
    rotation: 0,
    opacity: 1,
    locked: false,
    chartType: 'bar',
    title: 'Indicador clínico',
    data: [
      { label: 'Ene', value: 62 },
      { label: 'Feb', value: 74 },
      { label: 'Mar', value: 81 },
      { label: 'Abr', value: 88 },
    ],
    palette: ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'],
    ...patch,
  }
}

/** Etiqueta legible del tipo de elemento (para capas y propiedades). */
export function elementTypeLabel(el: EditorElement): string {
  switch (el.kind) {
    case 'text':
      return 'Texto'
    case 'rect':
      return 'Rectángulo'
    case 'ellipse':
      return 'Elipse'
    case 'line':
      return 'Conector'
    case 'image':
      return el.subtype === 'icon'
        ? 'Icono'
        : el.subtype === 'logo'
          ? 'Logo'
          : el.subtype === 'qr'
            ? 'QR'
            : 'Imagen'
    case 'table':
      return 'Tabla'
    case 'chart':
      return 'Gráfico'
  }
}
