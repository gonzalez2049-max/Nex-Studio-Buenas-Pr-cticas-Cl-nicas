import { create } from 'zustand'
import type { MaterialFormat } from '@/lib/domain'
import {
  pageHeight,
  pageWidth,
  uid,
  type EditorDocument,
  type EditorElement,
  type Page,
} from '@/editor/model'
import { getFormatDef } from '@/editor/formats'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

type AlignType =
  | 'left'
  | 'center-h'
  | 'right'
  | 'top'
  | 'center-v'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v'

interface EditorState {
  doc: EditorDocument
  currentPageId: string
  selectedIds: string[]
  zoom: number
  dirty: boolean
  past: EditorDocument[]
  future: EditorDocument[]

  /* selección y utilidades derivadas */
  currentPage: () => Page
  selectedElements: () => EditorElement[]

  /* ciclo de vida */
  load: (content: unknown, format: MaterialFormat) => void
  markSaved: () => void

  /* historial */
  pushHistory: () => void
  undo: () => void
  redo: () => void

  /* selección */
  select: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  selectAll: () => void

  /* elementos */
  addElements: (els: EditorElement[]) => void
  updateElement: (id: string, patch: Partial<EditorElement>, history?: boolean) => void
  updateSelected: (patch: Partial<EditorElement>, history?: boolean) => void
  removeSelected: () => void
  duplicateSelected: () => void
  toggleLockSelected: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  align: (type: AlignType) => void

  /* orden de capas */
  reorder: (id: string, dir: 'front' | 'back' | 'forward' | 'backward') => void

  /* páginas */
  setCurrentPage: (id: string) => void
  setPageBackground: (color: string) => void
  renamePage: (id: string, name: string) => void
  addPage: (index?: number) => void
  removePage: (id: string) => void
  duplicatePage: (id: string) => void
  movePage: (id: string, dir: 'up' | 'down') => void

  /* zoom */
  setZoom: (z: number) => void
  zoomIn: () => void
  zoomOut: () => void
}

function emptyDoc(format: MaterialFormat): EditorDocument {
  return getFormatDef(format).createDocument()
}

/** Normaliza el contenido guardado a un EditorDocument válido. */
function hydrate(content: unknown, format: MaterialFormat): EditorDocument {
  if (
    content &&
    typeof content === 'object' &&
    'schema' in (content as Record<string, unknown>) &&
    Array.isArray((content as EditorDocument).pages) &&
    (content as EditorDocument).pages.length > 0
  ) {
    return clone(content as EditorDocument)
  }
  return emptyDoc(format)
}

export const useEditor = create<EditorState>((set, get) => ({
  doc: emptyDoc('documento'),
  currentPageId: '',
  selectedIds: [],
  zoom: 1,
  dirty: false,
  past: [],
  future: [],

  currentPage: () => {
    const { doc, currentPageId } = get()
    return doc.pages.find((p) => p.id === currentPageId) ?? doc.pages[0]
  },

  selectedElements: () => {
    const page = get().currentPage()
    const ids = new Set(get().selectedIds)
    return page.elements.filter((e) => ids.has(e.id))
  },

  load: (content, format) => {
    const doc = hydrate(content, format)
    set({
      doc,
      currentPageId: doc.pages[0]?.id ?? '',
      selectedIds: [],
      past: [],
      future: [],
      dirty: false,
      zoom: 1,
    })
  },

  markSaved: () => set({ dirty: false }),

  pushHistory: () => {
    const { doc, past } = get()
    set({ past: [...past.slice(-49), clone(doc)], future: [] })
  },

  undo: () => {
    const { past, future, doc } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      doc: previous,
      past: past.slice(0, -1),
      future: [clone(doc), ...future].slice(0, 50),
      dirty: true,
      selectedIds: [],
    })
  },

  redo: () => {
    const { past, future, doc } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      doc: next,
      future: future.slice(1),
      past: [...past, clone(doc)],
      dirty: true,
      selectedIds: [],
    })
  },

  select: (ids) => set({ selectedIds: ids }),
  toggleSelection: (id) => {
    const ids = get().selectedIds
    set({
      selectedIds: ids.includes(id)
        ? ids.filter((i) => i !== id)
        : [...ids, id],
    })
  },
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: () =>
    set({ selectedIds: get().currentPage().elements.map((e) => e.id) }),

  addElements: (els) => {
    get().pushHistory()
    const { doc, currentPageId } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    page.elements.push(...els)
    set({ doc: next, selectedIds: els.map((e) => e.id), dirty: true })
  },

  updateElement: (id, patch, history = true) => {
    if (history) get().pushHistory()
    const { doc, currentPageId } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    const idx = page.elements.findIndex((e) => e.id === id)
    if (idx >= 0)
      page.elements[idx] = { ...page.elements[idx], ...patch } as EditorElement
    set({ doc: next, dirty: true })
  },

  updateSelected: (patch, history = true) => {
    if (history) get().pushHistory()
    const { doc, currentPageId, selectedIds } = get()
    const ids = new Set(selectedIds)
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    page.elements = page.elements.map((e) =>
      ids.has(e.id) && !e.locked ? ({ ...e, ...patch } as EditorElement) : e,
    )
    set({ doc: next, dirty: true })
  },

  removeSelected: () => {
    get().pushHistory()
    const { doc, currentPageId, selectedIds } = get()
    const ids = new Set(selectedIds)
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    page.elements = page.elements.filter((e) => !ids.has(e.id) || e.locked)
    set({ doc: next, selectedIds: [], dirty: true })
  },

  duplicateSelected: () => {
    get().pushHistory()
    const { doc, currentPageId, selectedIds } = get()
    const ids = new Set(selectedIds)
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    const copies: EditorElement[] = []
    for (const el of page.elements)
      if (ids.has(el.id)) {
        const c = clone(el)
        c.id = uid(el.kind)
        c.x += 24
        c.y += 24
        copies.push(c)
      }
    page.elements.push(...copies)
    set({ doc: next, selectedIds: copies.map((c) => c.id), dirty: true })
  },

  toggleLockSelected: () => {
    get().pushHistory()
    const { doc, currentPageId, selectedIds } = get()
    const ids = new Set(selectedIds)
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    const anyUnlocked = page.elements.some((e) => ids.has(e.id) && !e.locked)
    page.elements = page.elements.map((e) =>
      ids.has(e.id) ? { ...e, locked: anyUnlocked } : e,
    )
    set({ doc: next, dirty: true })
  },

  groupSelected: () => {
    const { selectedIds } = get()
    if (selectedIds.length < 2) return
    const gid = uid('grp')
    get().updateSelected({ groupId: gid })
  },

  ungroupSelected: () => get().updateSelected({ groupId: null }),

  align: (type) => {
    const { selectedIds } = get()
    if (selectedIds.length === 0) return
    get().pushHistory()
    const { doc, currentPageId } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    const sel = page.elements.filter((e) => selectedIds.includes(e.id))
    const W = pageWidth(next, page)
    const H = pageHeight(next, page)
    const single = sel.length === 1
    const minX = Math.min(...sel.map((e) => e.x))
    const maxX = Math.max(...sel.map((e) => e.x + e.width))
    const minY = Math.min(...sel.map((e) => e.y))
    const maxY = Math.max(...sel.map((e) => e.y + e.height))

    const apply = (fn: (e: EditorElement) => void) => {
      page.elements = page.elements.map((e) => {
        if (!selectedIds.includes(e.id) || e.locked) return e
        const c = { ...e }
        fn(c)
        return c
      })
    }

    switch (type) {
      case 'left':
        apply((e) => (e.x = single ? next.margin : minX))
        break
      case 'right':
        apply((e) => (e.x = single ? W - e.width - next.margin : maxX - e.width))
        break
      case 'center-h':
        apply((e) => (e.x = single ? (W - e.width) / 2 : (minX + maxX) / 2 - e.width / 2))
        break
      case 'top':
        apply((e) => (e.y = single ? next.margin : minY))
        break
      case 'bottom':
        apply((e) => (e.y = single ? H - e.height - next.margin : maxY - e.height))
        break
      case 'center-v':
        apply((e) => (e.y = single ? (H - e.height) / 2 : (minY + maxY) / 2 - e.height / 2))
        break
      case 'distribute-h': {
        const sorted = [...sel].sort((a, b) => a.x - b.x)
        if (sorted.length < 3) break
        const step = (maxX - minX - sorted.reduce((s, e) => s + e.width, 0)) / (sorted.length - 1)
        let cursor = minX
        const pos = new Map<string, number>()
        for (const e of sorted) {
          pos.set(e.id, cursor)
          cursor += e.width + step
        }
        apply((e) => {
          if (pos.has(e.id)) e.x = pos.get(e.id)!
        })
        break
      }
      case 'distribute-v': {
        const sorted = [...sel].sort((a, b) => a.y - b.y)
        if (sorted.length < 3) break
        const step = (maxY - minY - sorted.reduce((s, e) => s + e.height, 0)) / (sorted.length - 1)
        let cursor = minY
        const pos = new Map<string, number>()
        for (const e of sorted) {
          pos.set(e.id, cursor)
          cursor += e.height + step
        }
        apply((e) => {
          if (pos.has(e.id)) e.y = pos.get(e.id)!
        })
        break
      }
    }
    set({ doc: next, dirty: true })
  },

  reorder: (id, dir) => {
    get().pushHistory()
    const { doc, currentPageId } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    const idx = page.elements.findIndex((e) => e.id === id)
    if (idx < 0) return
    const [el] = page.elements.splice(idx, 1)
    if (dir === 'front') page.elements.push(el)
    else if (dir === 'back') page.elements.unshift(el)
    else if (dir === 'forward')
      page.elements.splice(Math.min(idx + 1, page.elements.length), 0, el)
    else page.elements.splice(Math.max(idx - 1, 0), 0, el)
    set({ doc: next, dirty: true })
  },

  setCurrentPage: (id) => set({ currentPageId: id, selectedIds: [] }),

  setPageBackground: (color) => {
    get().pushHistory()
    const { doc, currentPageId } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === currentPageId)!
    page.background = color
    set({ doc: next, dirty: true })
  },

  renamePage: (id, name) => {
    const { doc } = get()
    const next = clone(doc)
    const page = next.pages.find((p) => p.id === id)
    if (page) page.name = name
    set({ doc: next, dirty: true })
  },

  addPage: (index) => {
    get().pushHistory()
    const { doc } = get()
    const def = getFormatDef(doc.format)
    const builder = def.addablePages[0]
    const newPage: Page = builder
      ? builder.build(doc.pages.length)
      : {
          id: uid('pg'),
          name: `${def.pageKind} ${doc.pages.length + 1}`,
          background: '#ffffff',
          elements: [],
        }
    const next = clone(doc)
    const at = index ?? next.pages.length
    next.pages.splice(at, 0, newPage)
    set({ doc: next, currentPageId: newPage.id, selectedIds: [], dirty: true })
  },

  removePage: (id) => {
    const { doc } = get()
    if (doc.pages.length <= 1) return
    get().pushHistory()
    const next = clone(doc)
    next.pages = next.pages.filter((p) => p.id !== id)
    const current = get().currentPageId
    set({
      doc: next,
      currentPageId: current === id ? next.pages[0].id : current,
      selectedIds: [],
      dirty: true,
    })
  },

  duplicatePage: (id) => {
    get().pushHistory()
    const { doc } = get()
    const next = clone(doc)
    const idx = next.pages.findIndex((p) => p.id === id)
    if (idx < 0) return
    const copy = clone(next.pages[idx])
    copy.id = uid('pg')
    copy.name = `${copy.name} (copia)`
    copy.elements = copy.elements.map((e) => ({ ...e, id: uid(e.kind) }))
    next.pages.splice(idx + 1, 0, copy)
    set({ doc: next, currentPageId: copy.id, selectedIds: [], dirty: true })
  },

  movePage: (id, dir) => {
    get().pushHistory()
    const { doc } = get()
    const next = clone(doc)
    const idx = next.pages.findIndex((p) => p.id === id)
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= next.pages.length) return
    const [pg] = next.pages.splice(idx, 1)
    next.pages.splice(target, 0, pg)
    set({ doc: next, dirty: true })
  },

  setZoom: (z) => set({ zoom: Math.min(3, Math.max(0.1, z)) }),
  zoomIn: () => get().setZoom(get().zoom + 0.1),
  zoomOut: () => get().setZoom(get().zoom - 0.1),
}))
