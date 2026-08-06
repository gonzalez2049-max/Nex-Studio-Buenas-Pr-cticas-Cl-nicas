import type { EditorDocument, Page } from '@/editor/model'
import { renderPageToDataURL } from '@/editor/export/render'

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function slug(s: string) {
  return s.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')
}

/** Exporta una página (o la actual) a PNG en alta resolución. */
export async function exportPageToPng(
  doc: EditorDocument,
  page: Page,
  title: string,
): Promise<void> {
  const url = await renderPageToDataURL(doc, page, 3)
  download(url, `${slug(title)}-${slug(page.name)}.png`)
}

/** Exporta todas las páginas a PNG (una descarga por página). */
export async function exportAllToPng(
  doc: EditorDocument,
  title: string,
): Promise<void> {
  for (const page of doc.pages) {
    // eslint-disable-next-line no-await-in-loop
    await exportPageToPng(doc, page, title)
  }
}
