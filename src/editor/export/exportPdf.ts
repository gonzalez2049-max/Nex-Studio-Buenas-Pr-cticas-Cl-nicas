import { jsPDF } from 'jspdf'
import {
  pageHeight,
  pageWidth,
  type EditorDocument,
  type Page,
} from '@/editor/model'
import { renderPageToDataURL } from '@/editor/export/render'

/**
 * Exporta a PDF. Cada página se rasteriza en alta resolución y se coloca a su
 * tamaño real; el documento fuente permanece editable en NEX Studio.
 */
/** Construye el PDF (sin guardarlo). Útil para pruebas. */
export async function buildPdf(
  doc: EditorDocument,
  pages?: Page[],
): Promise<jsPDF> {
  const list = pages ?? doc.pages
  let pdf: jsPDF | null = null

  for (const page of list) {
    const w = pageWidth(doc, page)
    const h = pageHeight(doc, page)
    const orientation = w >= h ? 'landscape' : 'portrait'
    const dataUrl = await renderPageToDataURL(doc, page, 2)

    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] })
    } else {
      pdf.addPage([w, h], orientation)
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
  }
  return pdf!
}

export async function exportToPdf(
  doc: EditorDocument,
  title: string,
  pages?: Page[],
): Promise<void> {
  const list = pages ?? doc.pages
  if (list.length === 0) return
  const pdf = await buildPdf(doc, list)
  pdf.save(`${slug(title)}.pdf`)
}

function slug(s: string) {
  return s.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
}
