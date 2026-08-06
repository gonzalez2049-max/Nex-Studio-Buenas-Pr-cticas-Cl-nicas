import {
  pageHeight,
  pageWidth,
  type ChartElement,
  type EditorDocument,
  type EditorElement,
  type Page,
  type TableElement,
} from '@/editor/model'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(el: EditorElement, inner: string): string {
  const t = `translate(${el.x} ${el.y})`
  const r = el.rotation ? ` rotate(${el.rotation})` : ''
  const o = el.opacity < 1 ? ` opacity="${el.opacity}"` : ''
  return `<g transform="${t}${r}"${o}>${inner}</g>`
}

function textSvg(el: Extract<EditorElement, { kind: 'text' }>): string {
  const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start'
  const tx = el.align === 'center' ? el.width / 2 : el.align === 'right' ? el.width : 0
  const weight = el.fontStyle.includes('bold') ? '700' : '400'
  const italic = el.fontStyle.includes('italic') ? ' font-style="italic"' : ''
  const deco = el.textDecoration === 'underline' ? ' text-decoration="underline"' : ''
  const lines = el.text.split('\n')
  const lh = el.fontSize * el.lineHeight
  const tspans = lines
    .map((ln, i) => `<tspan x="${tx}" dy="${i === 0 ? el.fontSize : lh}">${esc(ln)}</tspan>`)
    .join('')
  return wrap(
    el,
    `<text font-family="${esc(el.fontFamily)}, Arial, sans-serif" font-size="${el.fontSize}" font-weight="${weight}"${italic}${deco} fill="${el.fill}" text-anchor="${anchor}">${tspans}</text>`,
  )
}

function tableSvg(el: TableElement): string {
  const cw = el.width / el.cols
  const rh = el.height / el.rows
  let s = ''
  for (let r = 0; r < el.rows; r++)
    for (let c = 0; c < el.cols; c++) {
      const fill = r === 0 ? el.headerFill : '#ffffff'
      const color = r === 0 ? el.headerTextColor : el.textColor
      s += `<rect x="${c * cw}" y="${r * rh}" width="${cw}" height="${rh}" fill="${fill}" stroke="${el.borderColor}"/>`
      s += `<text x="${c * cw + 8}" y="${r * rh + rh / 2 + el.fontSize / 3}" font-size="${el.fontSize}" font-family="Arial" font-weight="${r === 0 ? 700 : 400}" fill="${color}">${esc(el.cells[r]?.[c] ?? '')}</text>`
    }
  return wrap(el, s)
}

function chartSvg(el: ChartElement): string {
  let s = `<rect x="0" y="0" width="${el.width}" height="${el.height}" fill="#ffffff" stroke="#e2e8f0" rx="8"/>`
  const padT = el.title ? 40 : 16
  if (el.title)
    s += `<text x="16" y="28" font-size="16" font-weight="700" font-family="Arial" fill="#0f172a">${esc(el.title)}</text>`
  const padL = 16
  const padB = 28
  const cw = el.width - padL * 2
  const ch = el.height - padT - padB
  const max = Math.max(...el.data.map((d) => d.value), 1)
  if (el.chartType === 'pie') {
    const total = el.data.reduce((a, d) => a + d.value, 0) || 1
    const cx = el.width / 2
    const cy = padT + ch / 2
    const rad = Math.min(cw, ch) / 2 - 6
    let start = -Math.PI / 2
    el.data.forEach((d, i) => {
      const ang = (d.value / total) * Math.PI * 2
      const x1 = cx + rad * Math.cos(start)
      const y1 = cy + rad * Math.sin(start)
      const x2 = cx + rad * Math.cos(start + ang)
      const y2 = cy + rad * Math.sin(start + ang)
      const large = ang > Math.PI ? 1 : 0
      s += `<path d="M${cx} ${cy} L${x1} ${y1} A${rad} ${rad} 0 ${large} 1 ${x2} ${y2} Z" fill="${el.palette[i % el.palette.length]}"/>`
      start += ang
    })
  } else if (el.chartType === 'line') {
    const step = cw / Math.max(el.data.length - 1, 1)
    const pts = el.data.map((d, i) => `${padL + i * step},${padT + ch - (d.value / max) * ch}`).join(' ')
    s += `<polyline points="${pts}" fill="none" stroke="${el.palette[0]}" stroke-width="3"/>`
  } else {
    const gap = 10
    const bw = (cw - gap * (el.data.length - 1)) / el.data.length
    el.data.forEach((d, i) => {
      const bh = (d.value / max) * ch
      s += `<rect x="${padL + i * (bw + gap)}" y="${padT + ch - bh}" width="${bw}" height="${bh}" rx="4" fill="${el.palette[i % el.palette.length]}"/>`
    })
  }
  el.data.forEach((d, i) => {
    const step = cw / el.data.length
    s += `<text x="${padL + i * step + step / 2}" y="${el.height - padB + 16}" font-size="11" font-family="Arial" fill="#64748b" text-anchor="middle">${esc(d.label)}</text>`
  })
  return wrap(el, s)
}

function elementSvg(el: EditorElement): string {
  switch (el.kind) {
    case 'text':
      return textSvg(el)
    case 'rect':
      return wrap(el, `<rect width="${el.width}" height="${el.height}" rx="${el.cornerRadius}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`)
    case 'ellipse':
      return wrap(el, `<ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}"/>`)
    case 'line': {
      const p = el.points
      const dash = el.dashed ? ' stroke-dasharray="12 8"' : ''
      let marker = ''
      let extra = ''
      if (el.arrowEnd) {
        marker = `<marker id="ah-${el.id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="${el.stroke}"/></marker>`
        extra = ` marker-end="url(#ah-${el.id})"`
      }
      const pts = []
      for (let i = 0; i < p.length; i += 2) pts.push(`${p[i]},${p[i + 1]}`)
      return wrap(el, `${marker}<polyline points="${pts.join(' ')}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash}${extra}/>`)
    }
    case 'image':
      return wrap(el, `<image href="${esc(el.src)}" width="${el.width}" height="${el.height}" preserveAspectRatio="none"/>`)
    case 'table':
      return tableSvg(el)
    case 'chart':
      return chartSvg(el)
  }
}

export function pageToSvg(doc: EditorDocument, page: Page): string {
  const w = pageWidth(doc, page)
  const h = pageHeight(doc, page)
  const body = page.elements.map(elementSvg).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${page.background || '#ffffff'}"/>${body}</svg>`
}

function slug(s: string) {
  return s.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export function exportPageToSvg(doc: EditorDocument, page: Page, title: string): void {
  const svg = pageToSvg(doc, page)
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${slug(title)}-${slug(page.name)}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
}
