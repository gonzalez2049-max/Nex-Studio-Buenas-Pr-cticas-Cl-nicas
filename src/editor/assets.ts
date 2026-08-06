/**
 * Activos gráficos del editor: iconos clínicos, logos y generador de QR.
 * Todo se materializa como SVG → data URL para renderizarse como imagen en
 * Konva y exportarse sin dependencias externas.
 */

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Envuelve un cuerpo de trazos estilo lucide en un SVG completo. */
function lucide(body: string, color = '#0f172a'): string {
  return svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  )
}

export interface ClinicalIcon {
  id: string
  label: string
  body: string
}

/** Set curado de iconografía clínica (trazos estilo lucide). */
export const CLINICAL_ICONS: ClinicalIcon[] = [
  { id: 'stethoscope', label: 'Estetoscopio', body: '<path d="M4 3v5a4 4 0 0 0 8 0V3"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>' },
  { id: 'heart-pulse', label: 'Pulso', body: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.7-1.5 2 4 1.6-3.5 1 1h5.98"/>' },
  { id: 'pill', label: 'Medicamento', body: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>' },
  { id: 'syringe', label: 'Jeringa', body: '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>' },
  { id: 'shield-check', label: 'Seguridad', body: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>' },
  { id: 'clipboard', label: 'Protocolo', body: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>' },
  { id: 'microscope', label: 'Laboratorio', body: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>' },
  { id: 'hand-wash', label: 'Higiene', body: '<path d="M8 22V12a2 2 0 0 1 4 0v10"/><path d="M12 12a2 2 0 0 1 4 0v10"/><path d="M4 22V12a2 2 0 0 1 4 0"/><path d="M4 12V8a2 2 0 0 1 4 0"/><path d="M12 6V4"/><path d="M16 8V6"/>' },
  { id: 'activity', label: 'Signos vitales', body: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  { id: 'droplet', label: 'Gota', body: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' },
  { id: 'thermometer', label: 'Temperatura', body: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>' },
  { id: 'file-heart', label: 'Ficha', body: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M10.29 10.7a2 2 0 0 0-2.86.03l-.14.15-.14-.15a2 2 0 0 0-2.86-.03 2.13 2.13 0 0 0 0 3l3 3 3-3a2.13 2.13 0 0 0 0-3Z"/>' },
  { id: 'users', label: 'Equipo', body: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id: 'check-circle', label: 'Verificado', body: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>' },
  { id: 'alert', label: 'Alerta', body: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>' },
  { id: 'book', label: 'Guía', body: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>' },
]

export function iconDataUrl(id: string, color = '#0f172a'): string {
  const icon = CLINICAL_ICONS.find((i) => i.id === id) ?? CLINICAL_ICONS[0]
  return lucide(icon.body, color)
}

/** Logo institucional de marcador de posición. */
export function logoDataUrl(text = 'UBPC', color = '#0d9488'): string {
  return svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect width="200" height="80" rx="12" fill="${color}"/><text x="100" y="52" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">${text}</text></svg>`,
  )
}

/**
 * Generador de QR determinista y sin dependencias. No es un QR escaneable real,
 * sino una representación visual estable a partir del texto (marcador funcional
 * que se reemplazará por un QR real cuando se integre el backend de enlaces).
 */
export function qrDataUrl(text: string, color = '#0f172a'): string {
  const size = 21
  const cells: string[] = []
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = (n: number) => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return Math.abs(h + n) % 100
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4
        if (edge || inner)
          cells.push(
            `<rect x="${ox + x}" y="${oy + y}" width="1" height="1" fill="${color}"/>`,
          )
      }
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
      if (inFinder) continue
      if (rand(x * 31 + y) > 52)
        cells.push(
          `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`,
        )
    }
  finder(0, 0)
  finder(size - 7, 0)
  finder(0, size - 7)
  return svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff"/>${cells.join('')}</svg>`,
  )
}
