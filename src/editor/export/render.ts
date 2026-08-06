import Konva from 'konva'
import {
  pageHeight,
  pageWidth,
  type ChartElement,
  type EditorDocument,
  type Page,
  type TableElement,
} from '@/editor/model'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function shadowProps(el: { shadow?: { enabled: boolean; color: string; blur: number; offsetX: number; offsetY: number } }) {
  if (!el.shadow?.enabled) return {}
  return {
    shadowColor: el.shadow.color,
    shadowBlur: el.shadow.blur,
    shadowOffsetX: el.shadow.offsetX,
    shadowOffsetY: el.shadow.offsetY,
    shadowOpacity: 0.35,
  }
}

function drawTable(layer: Konva.Layer, el: TableElement) {
  const cw = el.width / el.cols
  const rh = el.height / el.rows
  const group = new Konva.Group({
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
  })
  for (let r = 0; r < el.rows; r++) {
    for (let c = 0; c < el.cols; c++) {
      group.add(
        new Konva.Rect({
          x: c * cw,
          y: r * rh,
          width: cw,
          height: rh,
          fill: r === 0 ? el.headerFill : '#ffffff',
          stroke: el.borderColor,
          strokeWidth: 1,
        }),
      )
      group.add(
        new Konva.Text({
          x: c * cw + 8,
          y: r * rh + rh / 2 - el.fontSize / 2,
          width: cw - 16,
          text: el.cells[r]?.[c] ?? '',
          fontSize: el.fontSize,
          fontFamily: 'Inter, Arial, sans-serif',
          fill: r === 0 ? el.headerTextColor : el.textColor,
          fontStyle: r === 0 ? 'bold' : 'normal',
          align: 'left',
          ellipsis: true,
          wrap: 'none',
        }),
      )
    }
  }
  layer.add(group)
}

function drawChart(layer: Konva.Layer, el: ChartElement) {
  const group = new Konva.Group({
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
  })
  group.add(
    new Konva.Rect({ x: 0, y: 0, width: el.width, height: el.height, fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 }),
  )
  const padT = el.title ? 40 : 16
  if (el.title)
    group.add(
      new Konva.Text({ x: 16, y: 12, width: el.width - 32, text: el.title, fontSize: 16, fontStyle: 'bold', fill: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }),
    )
  const padL = 16
  const padB = 28
  const cw = el.width - padL * 2
  const ch = el.height - padT - padB
  const max = Math.max(...el.data.map((d) => d.value), 1)

  if (el.chartType === 'pie') {
    const total = el.data.reduce((s, d) => s + d.value, 0) || 1
    const cx = el.width / 2
    const cy = padT + ch / 2
    const rad = Math.min(cw, ch) / 2 - 6
    let start = -90
    el.data.forEach((d, i) => {
      const angle = (d.value / total) * 360
      group.add(
        new Konva.Arc({ x: cx, y: cy, innerRadius: 0, outerRadius: rad, angle, rotation: start, fill: el.palette[i % el.palette.length] }),
      )
      start += angle
    })
  } else if (el.chartType === 'line') {
    const step = cw / Math.max(el.data.length - 1, 1)
    const pts: number[] = []
    el.data.forEach((d, i) => {
      pts.push(padL + i * step, padT + ch - (d.value / max) * ch)
    })
    group.add(new Konva.Line({ points: pts, stroke: el.palette[0], strokeWidth: 3, lineJoin: 'round' }))
    el.data.forEach((d, i) => {
      group.add(new Konva.Circle({ x: padL + i * step, y: padT + ch - (d.value / max) * ch, radius: 4, fill: el.palette[0] }))
    })
  } else {
    const gap = 10
    const bw = (cw - gap * (el.data.length - 1)) / el.data.length
    el.data.forEach((d, i) => {
      const bh = (d.value / max) * ch
      group.add(
        new Konva.Rect({ x: padL + i * (bw + gap), y: padT + ch - bh, width: bw, height: bh, fill: el.palette[i % el.palette.length], cornerRadius: 4 }),
      )
    })
  }
  el.data.forEach((d, i) => {
    const step = cw / el.data.length
    group.add(
      new Konva.Text({ x: padL + i * step, y: el.height - padB + 6, width: step, text: d.label, fontSize: 11, fill: '#64748b', align: 'center', fontFamily: 'Inter, Arial, sans-serif' }),
    )
  })
  layer.add(group)
}

/**
 * Renderiza una página a un data URL PNG usando un Stage de Konva desacoplado.
 * Se usa para exportar a imagen y PDF; el diseño permanece vectorial/editable
 * en el documento — esto es sólo la salida.
 */
export async function renderPageToDataURL(
  doc: EditorDocument,
  page: Page,
  pixelRatio = 2,
): Promise<string> {
  const w = pageWidth(doc, page)
  const h = pageHeight(doc, page)
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-100000px'
  container.style.top = '0'
  document.body.appendChild(container)

  const stage = new Konva.Stage({ container, width: w, height: h })
  const layer = new Konva.Layer()
  stage.add(layer)

  layer.add(new Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: page.background || '#ffffff' }))

  try {
    for (const el of page.elements) {
      if (el.kind === 'text') {
        layer.add(
          new Konva.Text({
            x: el.x, y: el.y, width: el.width, text: el.text, fontSize: el.fontSize,
            fontFamily: `${el.fontFamily}, Arial, sans-serif`, fontStyle: el.fontStyle || 'normal',
            textDecoration: el.textDecoration, align: el.align, fill: el.fill,
            lineHeight: el.lineHeight, rotation: el.rotation, opacity: el.opacity,
          }),
        )
      } else if (el.kind === 'rect') {
        layer.add(
          new Konva.Rect({ x: el.x, y: el.y, width: el.width, height: el.height, fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth, cornerRadius: el.cornerRadius, rotation: el.rotation, opacity: el.opacity, ...shadowProps(el) }),
        )
      } else if (el.kind === 'ellipse') {
        layer.add(
          new Konva.Ellipse({ x: el.x + el.width / 2, y: el.y + el.height / 2, radiusX: el.width / 2, radiusY: el.height / 2, fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth, rotation: el.rotation, opacity: el.opacity, ...shadowProps(el) }),
        )
      } else if (el.kind === 'line') {
        const common = { x: el.x, y: el.y, points: el.points, stroke: el.stroke, strokeWidth: el.strokeWidth, rotation: el.rotation, opacity: el.opacity, dash: el.dashed ? [12, 8] : undefined, lineCap: 'round' as const, lineJoin: 'round' as const }
        layer.add(el.arrowEnd || el.arrowStart ? new Konva.Arrow({ ...common, pointerAtBeginning: el.arrowStart, pointerAtEnding: el.arrowEnd }) : new Konva.Line(common))
      } else if (el.kind === 'image') {
        const img = await loadImage(el.src)
        layer.add(
          new Konva.Image({ x: el.x, y: el.y, width: el.width, height: el.height, image: img, rotation: el.rotation, opacity: el.opacity, cornerRadius: el.cornerRadius }),
        )
      } else if (el.kind === 'table') {
        drawTable(layer, el)
      } else if (el.kind === 'chart') {
        drawChart(layer, el)
      }
    }
    layer.draw()
    const url = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
    return url
  } finally {
    stage.destroy()
    container.remove()
  }
}
