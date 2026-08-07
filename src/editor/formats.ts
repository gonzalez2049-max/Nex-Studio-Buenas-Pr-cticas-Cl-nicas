/**
 * Registro de formatos del editor.
 *
 * Cada formato define su tamaño de página, su estructura (páginas iniciales y
 * páginas que se pueden añadir), sus bloques estructurales (inserciones rápidas
 * propias del formato) y su comportamiento de exportación. Así ningún formato
 * comparte un lienzo genérico: todos parten de una plantilla y unas herramientas
 * pensadas para su propósito.
 */
import type { MaterialFormat } from '@/lib/domain'
import {
  uid,
  type EditorDocument,
  type EditorElement,
  type Page,
} from '@/editor/model'
import {
  makeChart,
  makeEllipse,
  makeHeading,
  makeIcon,
  makeLine,
  makeLogo,
  makeQr,
  makeRect,
  makeText,
} from '@/editor/factory'

const BRAND = '#0d9488'
const INK = '#0f172a'
const MUTED = '#64748b'

export interface BlockContext {
  pageW: number
  pageH: number
}

export interface BlockDef {
  id: string
  label: string
  icon: string
  build: (ctx: BlockContext) => EditorElement[]
}

export interface AddablePage {
  kind: string
  label: string
  build: (index: number) => Page
}

export interface EditorFormatDef {
  size: { width: number; height: number }
  margin: number
  pageKind: string
  pageKindPlural: string
  paginated: boolean
  /** Tipos de página que el usuario puede añadir (diapositiva, componente…). */
  addablePages: AddablePage[]
  blocks: BlockDef[]
  export: { pdfOrientation: 'p' | 'l'; pptx: boolean }
  createDocument: () => EditorDocument
}

/* --------------------------------------------------------------- helpers --- */

function page(
  name: string,
  elements: EditorElement[],
  opts: Partial<Page> = {},
): Page {
  return {
    id: uid('pg'),
    name,
    background: '#ffffff',
    elements,
    ...opts,
  }
}

function doc(
  format: MaterialFormat,
  size: { width: number; height: number },
  pages: Page[],
  margin = 48,
): EditorDocument {
  return { schema: 1, format, pageSize: size, margin, pages }
}

function eyebrow(text: string, x: number, y: number) {
  return makeText({
    text,
    x,
    y,
    width: 400,
    height: 26,
    fontSize: 15,
    fontStyle: 'bold',
    fill: BRAND,
    name: 'Antetítulo',
  })
}

/* --------------------------------------------------------- tamaños base --- */

const A4_P = { width: 794, height: 1123 }
const A4_L = { width: 1123, height: 794 }
const SLIDE = { width: 1280, height: 720 }
const SQUARE = { width: 1080, height: 1080 }
const CARD = { width: 1004, height: 633 }

/* ------------------------------------------------------- bloques comunes --- */

const commonBlocks: BlockDef[] = [
  {
    id: 'title-block',
    label: 'Bloque de título',
    icon: 'Heading',
    build: ({ pageW }) => [
      eyebrow('SECCIÓN', 56, 56),
      makeHeading('Título de sección', { x: 56, y: 84, width: pageW - 112 }),
    ],
  },
  {
    id: 'bullets',
    label: 'Lista de puntos',
    icon: 'List',
    build: ({ pageW }) => [
      makeText({
        text: '•  Primer punto clave\n•  Segundo punto clave\n•  Tercer punto clave',
        x: 56,
        y: 160,
        width: pageW - 112,
        height: 140,
        fontSize: 22,
        lineHeight: 1.6,
      }),
    ],
  },
  {
    id: 'callout',
    label: 'Mensaje destacado',
    icon: 'Megaphone',
    build: ({ pageW }) => [
      makeRect({
        x: 56,
        y: 320,
        width: pageW - 112,
        height: 110,
        fill: '#ccfbf1',
        cornerRadius: 16,
      }),
      makeText({
        text: 'Mensaje clave que quieres resaltar.',
        x: 84,
        y: 352,
        width: pageW - 168,
        height: 60,
        fontSize: 22,
        fontStyle: 'bold',
        fill: '#0f766e',
      }),
    ],
  },
]

/* =========================================================== PRESENTACIÓN == */

function slideCover(): Page {
  return page(
    'Portada',
    [
      makeRect({ x: 0, y: 0, width: SLIDE.width, height: SLIDE.height, fill: '#0f172a', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeRect({ x: 0, y: 560, width: SLIDE.width, height: 12, fill: BRAND, cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeText({ text: 'BUENAS PRÁCTICAS CLÍNICAS', x: 96, y: 220, width: 900, height: 30, fontSize: 20, fontStyle: 'bold', fill: BRAND }),
      makeHeading('Título de la sesión', { x: 96, y: 256, width: 1000, height: 90, fontSize: 56, fill: '#ffffff' }),
      makeText({ text: 'Subtítulo · Ponente · Fecha', x: 96, y: 360, width: 900, height: 40, fontSize: 24, fill: '#cbd5e1' }),
      makeLogo(),
    ],
    { kind: 'Diapositiva', background: '#0f172a' },
  )
}

function slideContent(title = 'Contenido'): Page {
  return page(
    title,
    [
      eyebrow('SESIÓN', 96, 72),
      makeHeading(title, { x: 96, y: 100, width: 1088, height: 70, fontSize: 40 }),
      makeLine({ x: 96, y: 180, width: 1088, points: [0, 0, 1088, 0], arrowEnd: false, stroke: '#e2e8f0', strokeWidth: 2 }),
      makeText({
        text: '•  Punto uno\n•  Punto dos\n•  Punto tres',
        x: 96,
        y: 220,
        width: 1088,
        height: 320,
        fontSize: 26,
        lineHeight: 1.8,
      }),
    ],
    { kind: 'Diapositiva' },
  )
}

/* ============================================================= INFOGRAFÍA == */

function infographicDoc(): EditorDocument {
  const W = 800
  const H = 1400
  return doc(
    'infografia',
    { width: W, height: H },
    [
      page('Infografía', [
        makeRect({ x: 0, y: 0, width: W, height: 220, fill: '#0f766e', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
        makeText({ text: 'INFOGRAFÍA CLÍNICA', x: 48, y: 60, width: W - 96, height: 28, fontSize: 18, fontStyle: 'bold', fill: '#99f6e4' }),
        makeHeading('Título de la infografía', { x: 48, y: 92, width: W - 96, height: 90, fontSize: 40, fill: '#ffffff' }),
        // Bloque 1
        makeEllipse({ x: 48, y: 270, width: 64, height: 64, fill: '#ccfbf1', strokeWidth: 0 }),
        makeText({ text: '1', x: 48, y: 286, width: 64, height: 32, fontSize: 28, align: 'center', fontStyle: 'bold', fill: '#0f766e' }),
        makeText({ text: 'Primer concepto', x: 130, y: 274, width: W - 180, height: 34, fontSize: 24, fontStyle: 'bold', fill: INK }),
        makeText({ text: 'Descripción breve del primer punto de la guía o proceso clínico.', x: 130, y: 312, width: W - 180, height: 60, fontSize: 17, fill: MUTED }),
        // Gráfico
        makeChart({ x: 48, y: 430, width: W - 96, height: 300, title: 'Indicador de adherencia (%)' }),
        // Recomendaciones
        makeRect({ x: 48, y: 770, width: W - 96, height: 180, fill: '#f0fdfa', cornerRadius: 16 }),
        makeText({ text: 'Recomendaciones', x: 72, y: 792, width: W - 144, height: 30, fontSize: 22, fontStyle: 'bold', fill: '#0f766e' }),
        makeText({ text: '•  Recomendación uno\n•  Recomendación dos\n•  Recomendación tres', x: 72, y: 828, width: W - 144, height: 110, fontSize: 17, lineHeight: 1.6 }),
        // Referencias
        makeText({ text: 'Referencias', x: 48, y: 990, width: W - 96, height: 28, fontSize: 16, fontStyle: 'bold', fill: INK }),
        makeText({ text: '1. Autor A, et al. Revista. Año.\n2. Autor B, et al. Revista. Año.', x: 48, y: 1022, width: W - 96, height: 80, fontSize: 13, fill: MUTED, lineHeight: 1.5 }),
        makeQr('https://ubpc.org/infografia'),
        makeLogo(),
      ]),
    ],
    40,
  )
}

/* ================================================================ TRÍPTICO = */

function foldPanels(name: string, kind: string): Page {
  const W = A4_L.width
  const p3 = W / 3
  return page(
    name,
    [
      makeText({ text: `${kind} · Panel 1`, x: 40, y: 40, width: p3 - 80, height: 30, fontSize: 16, fontStyle: 'bold', fill: BRAND }),
      makeText({ text: `${kind} · Panel 2`, x: p3 + 40, y: 40, width: p3 - 80, height: 30, fontSize: 16, fontStyle: 'bold', fill: BRAND }),
      makeText({ text: `${kind} · Panel 3`, x: 2 * p3 + 40, y: 40, width: p3 - 80, height: 30, fontSize: 16, fontStyle: 'bold', fill: BRAND }),
    ],
    { kind, folds: [1 / 3, 2 / 3] },
  )
}

/* ================================================================ DÍPTICO = */

function foldPanels2(name: string, kind: string): Page {
  const W = A4_L.width
  const half = W / 2
  return page(
    name,
    [
      makeText({ text: `${kind} · Panel 1`, x: 40, y: 40, width: half - 80, height: 30, fontSize: 16, fontStyle: 'bold', fill: BRAND }),
      makeText({ text: `${kind} · Panel 2`, x: half + 40, y: 40, width: half - 80, height: 30, fontSize: 16, fontStyle: 'bold', fill: BRAND }),
    ],
    { kind, folds: [1 / 2] },
  )
}

/* ============================================================= FICHA RÁPIDA = */

const A5_P = { width: 559, height: 794 }

function fichaRapidaDoc(): EditorDocument {
  const W = A5_P.width
  return doc('ficha_rapida', A5_P, [
    page('Ficha rápida', [
      makeRect({ x: 0, y: 0, width: W, height: 96, fill: BRAND, cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeText({ text: 'FICHA RÁPIDA', x: 32, y: 24, width: W - 64, height: 22, fontSize: 14, fontStyle: 'bold', fill: '#99f6e4' }),
      makeHeading('Título de la ficha', { x: 32, y: 48, width: W - 64, height: 38, fontSize: 26, fill: '#ffffff' }),
      makeText({ text: '•  Punto clave uno\n•  Punto clave dos\n•  Punto clave tres', x: 32, y: 130, width: W - 64, height: 200, fontSize: 17, lineHeight: 1.6 }),
      makeQr('https://ubpc.org/ficha-rapida'),
    ]),
  ], 28)
}

/* ========================================================== KIT CHAMPION == */

function kitComponent(kind: string, size: { width: number; height: number }, els: EditorElement[]): Page {
  return page(kind, els, { kind, width: size.width, height: size.height })
}

function kitDocument(): EditorDocument {
  const pages: Page[] = [
    kitComponent('Portada', A4_P, [
      makeRect({ x: 0, y: 0, width: A4_P.width, height: A4_P.height, fill: '#0f172a', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeText({ text: 'KIT CHAMPION', x: 64, y: 360, width: A4_P.width - 128, height: 34, fontSize: 22, fontStyle: 'bold', fill: BRAND }),
      makeHeading('Nombre de la campaña', { x: 64, y: 400, width: A4_P.width - 128, height: 120, fontSize: 48, fill: '#ffffff' }),
      makeLogo(),
    ]),
    kitComponent('Mensaje clave', A4_P, [
      eyebrow('MENSAJE CLAVE', 64, 80),
      makeHeading('La idea central en una frase.', { x: 64, y: 120, width: A4_P.width - 128, height: 220, fontSize: 40 }),
    ]),
    kitComponent('Cápsula', SQUARE, [
      eyebrow('CÁPSULA', 64, 64),
      makeHeading('Cápsula formativa', { x: 64, y: 100, width: SQUARE.width - 128, height: 80 }),
      makeText({ text: 'Contenido breve de lectura rápida.', x: 64, y: 200, width: SQUARE.width - 128, height: 200, fontSize: 28, lineHeight: 1.5 }),
    ]),
    kitComponent('Tarjeta', CARD, [
      makeRect({ x: 24, y: 24, width: CARD.width - 48, height: CARD.height - 48, fill: '#f0fdfa', cornerRadius: 20 }),
      makeHeading('Tarjeta de bolsillo', { x: 56, y: 72, width: CARD.width - 112, height: 60, fontSize: 34 }),
      makeText({ text: 'Recordatorio esencial para el día a día.', x: 56, y: 140, width: CARD.width - 112, height: 80, fontSize: 20 }),
      makeQr('https://ubpc.org/kit'),
    ]),
    kitComponent('Afiche', A4_P, [
      makeHeading('Afiche mural', { x: 64, y: 90, width: A4_P.width - 128, height: 120, fontSize: 52, align: 'center' }),
      makeIcon('shield-check', BRAND),
      makeText({ text: 'Llamado a la acción', x: 64, y: 900, width: A4_P.width - 128, height: 60, fontSize: 28, align: 'center', fontStyle: 'bold', fill: BRAND }),
    ]),
    kitComponent('Checklist', A4_P, checklistElements()),
    kitComponent('Acción semanal', A4_P, [
      eyebrow('ACCIÓN SEMANAL', 64, 80),
      makeHeading('Reto de la semana', { x: 64, y: 120, width: A4_P.width - 128, height: 70 }),
      makeText({ text: 'Semana 1: …\nSemana 2: …\nSemana 3: …\nSemana 4: …', x: 64, y: 210, width: A4_P.width - 128, height: 220, fontSize: 22, lineHeight: 1.8 }),
    ]),
    kitComponent('Referencias', A4_P, [
      eyebrow('REFERENCIAS', 64, 80),
      makeText({ text: '1. Autor A, et al. Revista. Año.\n2. Autor B, et al. Revista. Año.', x: 64, y: 130, width: A4_P.width - 128, height: 200, fontSize: 16, lineHeight: 1.7, fill: MUTED }),
      makeQr('https://ubpc.org/referencias'),
    ]),
  ]
  return doc('kit_champion', A4_P, pages, 40)
}

/* ============================================================== CHECKLIST == */

function checklistElements(): EditorElement[] {
  const W = A4_P.width
  const els: EditorElement[] = [
    makeRect({ x: 0, y: 0, width: W, height: 120, fill: BRAND, cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
    makeHeading('Lista de verificación', { x: 40, y: 34, width: W - 80, height: 56, fontSize: 34, fill: '#ffffff' }),
    makeText({ text: 'SÍ  /  NO  /  N.A.', x: W - 260, y: 150, width: 220, height: 24, fontSize: 14, fontStyle: 'bold', align: 'right', fill: MUTED }),
    makeText({ text: 'Sección 1 — Preparación', x: 40, y: 150, width: 420, height: 30, fontSize: 20, fontStyle: 'bold', fill: INK }),
  ]
  const criteria = ['Criterio de verificación uno', 'Criterio de verificación dos', 'Criterio de verificación tres']
  criteria.forEach((c, i) => {
    const y = 200 + i * 56
    els.push(makeText({ text: c, x: 40, y: y + 6, width: W - 260, height: 34, fontSize: 17 }))
    ;['S', 'N', 'NA'].forEach((_, j) => {
      els.push(makeRect({ x: W - 210 + j * 58, y, width: 40, height: 40, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2, cornerRadius: 8, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }))
    })
  })
  const base = 200 + criteria.length * 56 + 30
  els.push(makeText({ text: 'Observaciones', x: 40, y: base, width: W - 80, height: 26, fontSize: 16, fontStyle: 'bold' }))
  els.push(makeRect({ x: 40, y: base + 32, width: W - 80, height: 120, fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, cornerRadius: 8, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }))
  els.push(makeLine({ x: 40, y: base + 220, width: 300, points: [0, 0, 300, 0], arrowEnd: false, stroke: '#334155', strokeWidth: 1 }))
  els.push(makeText({ text: 'Firma y fecha', x: 40, y: base + 230, width: 300, height: 24, fontSize: 14, fill: MUTED }))
  return els
}

/* ============================================================= BOLETÍN EVI = */

function eviField(label: string, y: number): EditorElement[] {
  const W = A4_P.width
  return [
    makeText({ text: label.toUpperCase(), x: 48, y, width: 200, height: 22, fontSize: 13, fontStyle: 'bold', fill: BRAND }),
    makeText({ text: '…', x: 48, y: y + 24, width: W - 220, height: 40, fontSize: 18, fill: INK }),
  ]
}

function eviDocument(): EditorDocument {
  const W = A4_P.width
  const els: EditorElement[] = [
    makeRect({ x: 0, y: 0, width: W, height: 110, fill: '#0f766e', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
    makeText({ text: 'BOLETÍN EVI', x: 48, y: 30, width: 300, height: 30, fontSize: 24, fontStyle: 'bold', fill: '#ffffff' }),
    makeText({ text: 'Evidencia en Buenas Prácticas Clínicas', x: 48, y: 66, width: 500, height: 24, fontSize: 14, fill: '#99f6e4' }),
    makeText({ text: 'Año', x: W - 140, y: 40, width: 92, height: 30, fontSize: 18, align: 'right', fill: '#ffffff' }),
  ]
  const fields = ['Autores', 'Estudio', 'Hallazgo', 'Mensaje clave', 'Aplicación clínica', 'Referencia']
  fields.forEach((f, i) => els.push(...eviField(f, 150 + i * 130)))
  els.push(makeQr('https://ubpc.org/evi'))
  return doc('boletin', A4_P, [page('Boletín EVI', els)], 40)
}

/* ============================================ CÁPSULA / AFICHE / TARJETA === */

function squareCapsule(): EditorDocument {
  const S = SQUARE.width
  return doc('video_guion', SQUARE, [
    page('Cápsula', [
      makeRect({ x: 0, y: 0, width: S, height: S, fill: '#ecfeff', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeIcon('activity', BRAND),
      makeText({ text: 'CÁPSULA', x: 80, y: 300, width: S - 160, height: 30, fontSize: 22, fontStyle: 'bold', fill: BRAND }),
      makeHeading('Idea de lectura rápida', { x: 80, y: 340, width: S - 160, height: 200, fontSize: 52 }),
      makeText({ text: 'Una frase de refuerzo.', x: 80, y: 560, width: S - 160, height: 60, fontSize: 26, fill: MUTED }),
      makeLogo(),
    ]),
  ], 60)
}

function posterDoc(): EditorDocument {
  const W = A4_P.width
  return doc('poster', A4_P, [
    page('Afiche', [
      makeRect({ x: 0, y: 0, width: W, height: A4_P.height, fill: '#0f172a', cornerRadius: 0, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      makeIcon('shield-check', BRAND),
      makeHeading('MENSAJE PRINCIPAL', { x: 48, y: 520, width: W - 96, height: 200, fontSize: 60, align: 'center', fill: '#ffffff' }),
      makeText({ text: 'Subtítulo o llamado a la acción', x: 48, y: 740, width: W - 96, height: 60, fontSize: 26, align: 'center', fill: '#cbd5e1' }),
      makeQr('https://ubpc.org/afiche'),
      makeLogo(),
    ]),
  ], 48)
}

function cardDoc(): EditorDocument {
  return doc('ficha_tecnica', CARD, [
    page('Tarjeta', [
      makeRect({ x: 0, y: 0, width: CARD.width, height: CARD.height, fill: '#ffffff', stroke: BRAND, strokeWidth: 4, cornerRadius: 24, shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 } }),
      eyebrow('FICHA TÉCNICA', 56, 56),
      makeHeading('Título de la ficha', { x: 56, y: 90, width: CARD.width - 112, height: 60, fontSize: 34 }),
      makeText({ text: '•  Dato clave uno\n•  Dato clave dos\n•  Dato clave tres', x: 56, y: 170, width: CARD.width - 260, height: 200, fontSize: 18, lineHeight: 1.6 }),
      makeQr('https://ubpc.org/ficha'),
    ]),
  ], 32)
}

/* ================================================ FLUJOGRAMA / MAPA MENTAL = */

function flowNode(text: string, x: number, y: number, fill = '#e0f2fe') {
  return [
    makeRect({ x, y, width: 220, height: 84, fill, stroke: '#0284c7', strokeWidth: 2, cornerRadius: 12 }),
    makeText({ text, x: x + 12, y: y + 26, width: 196, height: 40, fontSize: 18, align: 'center', fill: INK }),
  ]
}

function flowchartDoc(): EditorDocument {
  const W = 1200
  const H = 900
  const cx = W / 2 - 110
  return doc('flujograma', { width: W, height: H }, [
    page('Flujograma', [
      ...flowNode('Inicio', cx, 60, '#dcfce7'),
      makeLine({ x: cx + 110, y: 144, width: 0, height: 60, points: [0, 0, 0, 60], arrowEnd: true, stroke: '#334155', strokeWidth: 3 }),
      ...flowNode('Actividad', cx, 210),
      makeLine({ x: cx + 110, y: 294, width: 0, height: 60, points: [0, 0, 0, 60], arrowEnd: true, stroke: '#334155', strokeWidth: 3 }),
      // Decisión (rombo con elipse como marcador)
      makeRect({ x: cx, y: 360, width: 220, height: 110, fill: '#fef9c3', stroke: '#ca8a04', strokeWidth: 2, cornerRadius: 8, rotation: 0 }),
      makeText({ text: '¿Decisión?', x: cx + 12, y: 400, width: 196, height: 34, fontSize: 18, align: 'center', fill: INK }),
      makeLine({ x: cx + 110, y: 470, width: 0, height: 60, points: [0, 0, 0, 60], arrowEnd: true, stroke: '#334155', strokeWidth: 3 }),
      ...flowNode('Fin', cx, 540, '#fee2e2'),
    ]),
  ], 40)
}

function mindmapDoc(): EditorDocument {
  const W = 1400
  const H = 875
  const cx = W / 2
  const cy = H / 2
  const branches = [
    { t: 'Rama 1', x: cx - 520, y: cy - 220 },
    { t: 'Rama 2', x: cx + 300, y: cy - 220 },
    { t: 'Rama 3', x: cx - 520, y: cy + 140 },
    { t: 'Rama 4', x: cx + 300, y: cy + 140 },
  ]
  const els: EditorElement[] = [
    makeEllipse({ x: cx - 130, y: cy - 70, width: 260, height: 140, fill: BRAND, strokeWidth: 0 }),
    makeText({ text: 'Concepto central', x: cx - 120, y: cy - 20, width: 240, height: 40, fontSize: 22, align: 'center', fontStyle: 'bold', fill: '#ffffff' }),
  ]
  branches.forEach((b) => {
    els.push(makeLine({ x: cx, y: cy, width: b.x - cx + 110, height: b.y - cy + 30, points: [0, 0, b.x - cx + 110, b.y - cy + 30], arrowEnd: false, stroke: '#94a3b8', strokeWidth: 3 }))
    els.push(makeRect({ x: b.x, y: b.y, width: 220, height: 70, fill: '#f1f5f9', stroke: BRAND, strokeWidth: 2, cornerRadius: 35 }))
    els.push(makeText({ text: b.t, x: b.x + 12, y: b.y + 20, width: 196, height: 34, fontSize: 18, align: 'center', fill: INK }))
  })
  return doc('mapa_mental', { width: W, height: H }, [page('Mapa mental', els)], 40)
}

function clockDoc(): EditorDocument {
  const S = 900
  const cx = S / 2
  const cy = S / 2
  const R = 340
  const els: EditorElement[] = [
    makeEllipse({ x: cx - R, y: cy - R, width: R * 2, height: R * 2, fill: '#f8fafc', stroke: BRAND, strokeWidth: 4 }),
    makeEllipse({ x: cx - 70, y: cy - 70, width: 140, height: 140, fill: BRAND, strokeWidth: 0 }),
    makeText({ text: 'ROLES', x: cx - 70, y: cy - 16, width: 140, height: 34, fontSize: 20, align: 'center', fontStyle: 'bold', fill: '#ffffff' }),
  ]
  const n = 6
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * (R - 80) - 90
    const y = cy + Math.sin(a) * (R - 80) - 40
    els.push(makeRect({ x, y, width: 180, height: 80, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 2, cornerRadius: 12 }))
    els.push(makeText({ text: `Posición ${i + 1}`, x: x + 10, y: y + 26, width: 160, height: 30, fontSize: 16, align: 'center', fill: INK }))
  }
  return doc('reloj_posicion', { width: S, height: S }, [page('Reloj de posición', els)], 40)
}

/* ================================================================ registro = */

const structureBlocks = {
  checklist: [
    {
      id: 'chk-section',
      label: 'Sección + criterio',
      icon: 'ListPlus',
      build: ({ pageW }: BlockContext) => {
        const els: EditorElement[] = [
          makeText({ text: 'Nueva sección', x: 40, y: 400, width: 420, height: 30, fontSize: 20, fontStyle: 'bold', fill: INK }),
          makeText({ text: 'Nuevo criterio de verificación', x: 40, y: 446, width: pageW - 260, height: 34, fontSize: 17 }),
        ]
        ;[0, 1, 2].forEach((j) =>
          els.push(makeRect({ x: pageW - 210 + j * 58, y: 440, width: 40, height: 40, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 2, cornerRadius: 8 })),
        )
        return els
      },
    },
  ],
  boletin: [
    {
      id: 'evi-field',
      label: 'Campo EVI',
      icon: 'TextCursorInput',
      build: ({ pageW }: BlockContext) => [
        makeText({ text: 'NUEVO CAMPO', x: 48, y: 420, width: 200, height: 22, fontSize: 13, fontStyle: 'bold', fill: BRAND }),
        makeText({ text: '…', x: 48, y: 444, width: pageW - 220, height: 40, fontSize: 18 }),
      ],
    },
  ],
  flujograma: [
    { id: 'fc-node', label: 'Nodo', icon: 'Square', build: () => flowNode('Actividad', 120, 120) },
    { id: 'fc-decision', label: 'Decisión', icon: 'Diamond', build: () => [makeRect({ x: 120, y: 120, width: 220, height: 110, fill: '#fef9c3', stroke: '#ca8a04', strokeWidth: 2, cornerRadius: 8 }), makeText({ text: '¿Decisión?', x: 132, y: 160, width: 196, height: 34, fontSize: 18, align: 'center' })] },
    { id: 'fc-connector', label: 'Conector', icon: 'MoveRight', build: () => [makeLine({ x: 140, y: 300, width: 160, points: [0, 0, 160, 0], arrowEnd: true })] },
  ],
  mapa_mental: [
    { id: 'mm-branch', label: 'Rama', icon: 'GitBranch', build: () => [makeRect({ x: 140, y: 140, width: 220, height: 70, fill: '#f1f5f9', stroke: BRAND, strokeWidth: 2, cornerRadius: 35 }), makeText({ text: 'Rama', x: 152, y: 160, width: 196, height: 34, fontSize: 18, align: 'center' })] },
  ],
} satisfies Record<string, BlockDef[]>

export const EDITOR_FORMATS: Record<MaterialFormat, EditorFormatDef> = {
  presentacion: {
    size: SLIDE,
    margin: 64,
    pageKind: 'Diapositiva',
    pageKindPlural: 'Diapositivas',
    paginated: true,
    addablePages: [
      { kind: 'Diapositiva', label: 'Diapositiva de contenido', build: () => slideContent('Nueva diapositiva') },
      { kind: 'Portada', label: 'Portada', build: () => slideCover() },
    ],
    blocks: commonBlocks,
    export: { pdfOrientation: 'l', pptx: true },
    createDocument: () => doc('presentacion', SLIDE, [slideCover(), slideContent('Agenda'), slideContent('Desarrollo')], 64),
  },
  infografia: {
    size: { width: 800, height: 1400 },
    margin: 40,
    pageKind: 'Página',
    pageKindPlural: 'Páginas',
    paginated: false,
    addablePages: [],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: true },
    createDocument: infographicDoc,
  },
  triptico: {
    size: A4_L,
    margin: 36,
    pageKind: 'Cara',
    pageKindPlural: 'Caras',
    paginated: true,
    addablePages: [
      { kind: 'Cara', label: 'Cara con 3 paneles', build: (i) => foldPanels(`Cara ${i + 1}`, 'Cara') },
    ],
    blocks: commonBlocks,
    export: { pdfOrientation: 'l', pptx: true },
    createDocument: () =>
      doc('triptico', A4_L, [foldPanels('Cara externa', 'Cara externa'), foldPanels('Cara interna', 'Cara interna')], 36),
  },
  diptico: {
    size: A4_L,
    margin: 36,
    pageKind: 'Cara',
    pageKindPlural: 'Caras',
    paginated: true,
    addablePages: [
      { kind: 'Cara', label: 'Cara con 2 paneles', build: (i) => foldPanels2(`Cara ${i + 1}`, 'Cara') },
    ],
    blocks: commonBlocks,
    export: { pdfOrientation: 'l', pptx: true },
    createDocument: () =>
      doc('diptico', A4_L, [foldPanels2('Cara externa', 'Cara externa'), foldPanels2('Cara interna', 'Cara interna')], 36),
  },
  ficha_rapida: {
    size: A5_P,
    margin: 28,
    pageKind: 'Ficha',
    pageKindPlural: 'Fichas',
    paginated: true,
    addablePages: [{ kind: 'Ficha', label: 'Ficha rápida', build: () => page('Ficha rápida', [makeHeading('Título', { x: 32, y: 48, width: A5_P.width - 64, height: 40 })]) }],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: fichaRapidaDoc,
  },
  kit_champion: {
    size: A4_P,
    margin: 40,
    pageKind: 'Componente',
    pageKindPlural: 'Componentes',
    paginated: true,
    addablePages: [
      { kind: 'Componente', label: 'Componente A4', build: (i) => kitComponent(`Componente ${i + 1}`, A4_P, [makeHeading('Nuevo componente', { x: 64, y: 80, width: A4_P.width - 128, height: 70 })]) },
      { kind: 'Tarjeta', label: 'Tarjeta', build: () => kitComponent('Tarjeta', CARD, [makeHeading('Tarjeta', { x: 56, y: 72, width: CARD.width - 112, height: 60 })]) },
    ],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: true },
    createDocument: kitDocument,
  },
  checklist: {
    size: A4_P,
    margin: 40,
    pageKind: 'Página',
    pageKindPlural: 'Páginas',
    paginated: true,
    addablePages: [{ kind: 'Página', label: 'Página de checklist', build: () => page('Checklist', checklistElements()) }],
    blocks: structureBlocks.checklist,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: () => doc('checklist', A4_P, [page('Checklist', checklistElements())], 40),
  },
  boletin: {
    size: A4_P,
    margin: 40,
    pageKind: 'Página',
    pageKindPlural: 'Páginas',
    paginated: false,
    addablePages: [],
    blocks: structureBlocks.boletin,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: eviDocument,
  },
  video_guion: {
    size: SQUARE,
    margin: 60,
    pageKind: 'Cápsula',
    pageKindPlural: 'Cápsulas',
    paginated: true,
    addablePages: [{ kind: 'Cápsula', label: 'Cápsula cuadrada', build: () => page('Cápsula', [makeHeading('Idea', { x: 80, y: 340, width: SQUARE.width - 160, height: 120 })]) }],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: true },
    createDocument: squareCapsule,
  },
  poster: {
    size: A4_P,
    margin: 48,
    pageKind: 'Afiche',
    pageKindPlural: 'Afiches',
    paginated: false,
    addablePages: [],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: posterDoc,
  },
  ficha_tecnica: {
    size: CARD,
    margin: 32,
    pageKind: 'Tarjeta',
    pageKindPlural: 'Tarjetas',
    paginated: true,
    addablePages: [{ kind: 'Tarjeta', label: 'Tarjeta', build: () => page('Tarjeta', [makeHeading('Ficha', { x: 56, y: 90, width: CARD.width - 112, height: 60 })]) }],
    blocks: commonBlocks,
    export: { pdfOrientation: 'l', pptx: false },
    createDocument: cardDoc,
  },
  flujograma: {
    size: { width: 1200, height: 900 },
    margin: 40,
    pageKind: 'Lienzo',
    pageKindPlural: 'Lienzos',
    paginated: false,
    addablePages: [],
    blocks: structureBlocks.flujograma,
    export: { pdfOrientation: 'l', pptx: false },
    createDocument: flowchartDoc,
  },
  mapa_mental: {
    size: { width: 1400, height: 875 },
    margin: 40,
    pageKind: 'Lienzo',
    pageKindPlural: 'Lienzos',
    paginated: false,
    addablePages: [],
    blocks: structureBlocks.mapa_mental,
    export: { pdfOrientation: 'l', pptx: false },
    createDocument: mindmapDoc,
  },
  reloj_posicion: {
    size: { width: 900, height: 900 },
    margin: 40,
    pageKind: 'Lienzo',
    pageKindPlural: 'Lienzos',
    paginated: false,
    addablePages: [],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: clockDoc,
  },
  documento: {
    size: A4_P,
    margin: 56,
    pageKind: 'Página',
    pageKindPlural: 'Páginas',
    paginated: true,
    addablePages: [{ kind: 'Página', label: 'Página en blanco', build: () => page('Página', []) }],
    blocks: commonBlocks,
    export: { pdfOrientation: 'p', pptx: false },
    createDocument: () =>
      doc('documento', A4_P, [
        page('Documento', [
          eyebrow('DOCUMENTO', 56, 56),
          makeHeading('Título del documento', { x: 56, y: 88, width: A4_P.width - 112, height: 70 }),
          makeText({ text: 'Escribe el contenido del documento…', x: 56, y: 180, width: A4_P.width - 112, height: 400, fontSize: 18, lineHeight: 1.7 }),
        ]),
      ], 56),
  },
}

export function getFormatDef(format: MaterialFormat): EditorFormatDef {
  return EDITOR_FORMATS[format] ?? EDITOR_FORMATS.documento
}
