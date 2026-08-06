import pptxgen from 'pptxgenjs'
import {
  pageHeight,
  pageWidth,
  type EditorDocument,
  type EditorElement,
  type Page,
} from '@/editor/model'

const PX_PER_IN = 96
const px = (v: number) => v / PX_PER_IN
const pt = (v: number) => Math.round(v * 0.75)
const hex = (c: string) => (c || '#000000').replace('#', '').slice(0, 6).toUpperCase()

/**
 * Exporta el documento a PPTX con objetos NATIVOS de PowerPoint (cuadros de
 * texto, formas, imágenes, tablas y gráficos). No se aplana a imagen: cada
 * elemento sigue siendo editable en PowerPoint.
 */
/** Construye la presentación PPTX (sin escribir a disco). Útil para pruebas. */
export function buildPptx(doc: EditorDocument, title: string): pptxgen {
  const pptx = new pptxgen()
  const baseW = doc.pageSize.width
  const baseH = doc.pageSize.height
  pptx.defineLayout({ name: 'NEX', width: px(baseW), height: px(baseH) })
  pptx.layout = 'NEX'
  pptx.author = 'NEX Studio'
  pptx.title = title

  for (const page of doc.pages) addSlide(pptx, doc, page, baseW, baseH)
  return pptx
}

export async function exportToPptx(
  doc: EditorDocument,
  title: string,
): Promise<void> {
  await buildPptx(doc, title).writeFile({ fileName: `${slug(title)}.pptx` })
}

function addSlide(
  pptx: pptxgen,
  doc: EditorDocument,
  page: Page,
  baseW: number,
  baseH: number,
) {
  const slide = pptx.addSlide()
  slide.background = { color: hex(page.background || '#FFFFFF') }

  const pw = pageWidth(doc, page)
  const ph = pageHeight(doc, page)
  // Escala páginas de distinto tamaño (p. ej. componentes del kit) al lienzo.
  const scale = Math.min(baseW / pw, baseH / ph)
  const offX = (baseW - pw * scale) / 2
  const offY = (baseH - ph * scale) / 2
  const X = (v: number) => px(offX + v * scale)
  const Y = (v: number) => px(offY + v * scale)
  const S = (v: number) => px(v * scale)

  for (const el of page.elements) addElement(pptx, slide, el, X, Y, S, scale)
}

function addElement(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  el: EditorElement,
  X: (v: number) => number,
  Y: (v: number) => number,
  S: (v: number) => number,
  scale: number,
) {
  const box = { x: X(el.x), y: Y(el.y), w: S(el.width), h: S(el.height), rotate: el.rotation || 0 }

  switch (el.kind) {
    case 'text':
      slide.addText(el.text, {
        ...box,
        fontSize: pt(el.fontSize * scale),
        bold: el.fontStyle.includes('bold'),
        italic: el.fontStyle.includes('italic'),
        underline: el.textDecoration === 'underline' ? { style: 'sng' as const } : undefined,
        color: hex(el.fill),
        align: el.align,
        valign: 'top',
        fontFace: 'Arial',
        lineSpacingMultiple: el.lineHeight,
      })
      break
    case 'rect':
      slide.addShape(pptx.ShapeType.roundRect, {
        ...box,
        fill: { color: hex(el.fill) },
        line: el.strokeWidth ? { color: hex(el.stroke), width: el.strokeWidth * scale } : { type: 'none' },
        rectRadius: px(el.cornerRadius * scale),
      })
      break
    case 'ellipse':
      slide.addShape(pptx.ShapeType.ellipse, {
        ...box,
        fill: { color: hex(el.fill) },
        line: el.strokeWidth ? { color: hex(el.stroke), width: el.strokeWidth * scale } : { type: 'none' },
      })
      break
    case 'line': {
      const [x1, y1, x2, y2] = el.points
      slide.addShape(pptx.ShapeType.line, {
        x: X(el.x + Math.min(x1, x2)),
        y: Y(el.y + Math.min(y1, y2)),
        w: S(Math.abs(x2 - x1)) || 0.01,
        h: S(Math.abs(y2 - y1)) || 0.01,
        line: {
          color: hex(el.stroke),
          width: el.strokeWidth * scale,
          dashType: el.dashed ? 'dash' : 'solid',
          endArrowType: el.arrowEnd ? 'triangle' : undefined,
          beginArrowType: el.arrowStart ? 'triangle' : undefined,
        },
      })
      break
    }
    case 'image':
      slide.addImage({ ...box, data: toPptxImageData(el.src) })
      break
    case 'table': {
      const rows = el.cells.map((row, r) =>
        row.map((text) => ({
          text,
          options: {
            fontSize: pt(el.fontSize * scale),
            color: r === 0 ? hex(el.headerTextColor) : hex(el.textColor),
            fill: { color: r === 0 ? hex(el.headerFill) : 'FFFFFF' },
            bold: r === 0,
            align: 'left' as const,
            valign: 'middle' as const,
          },
        })),
      )
      slide.addTable(rows, { ...box, border: { type: 'solid', color: hex(el.borderColor), pt: 1 } })
      break
    }
    case 'chart': {
      const type =
        el.chartType === 'line'
          ? pptx.ChartType.line
          : el.chartType === 'pie'
            ? pptx.ChartType.pie
            : pptx.ChartType.bar
      slide.addChart(
        type,
        [
          {
            name: el.title || 'Serie',
            labels: el.data.map((d) => d.label),
            values: el.data.map((d) => d.value),
          },
        ],
        { ...box, showTitle: Boolean(el.title), title: el.title, chartColors: el.palette.map(hex) },
      )
      break
    }
  }
}

function slug(s: string) {
  return s.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
}

/**
 * PowerPoint requiere data URIs en base64. Los activos SVG del editor
 * (iconos, logo, QR) se generan como `data:image/svg+xml;utf8,…`; aquí se
 * reconvierten a base64 para que se incrusten correctamente.
 */
function toPptxImageData(src: string): string {
  if (src.startsWith('data:image/svg+xml') && !src.includes(';base64,')) {
    const comma = src.indexOf(',')
    const raw = decodeURIComponent(src.slice(comma + 1))
    const b64 = btoa(unescape(encodeURIComponent(raw)))
    return `data:image/svg+xml;base64,${b64}`
  }
  return src
}
