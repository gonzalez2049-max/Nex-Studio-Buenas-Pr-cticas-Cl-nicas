/**
 * Identidad visual por módulo de NEX Studio.
 *
 * Cada módulo tiene un color y un degradado propios. Se aplican mediante
 * estilos en línea (los hex son dinámicos y no pueden vivir en clases de
 * Tailwind), de modo que toda la interfaz comparte una misma paleta coherente.
 * Esto es puramente presentacional: no toca lógica, datos ni flujos.
 */

export type ModuleId =
  | 'inicio'
  | 'crear'
  | 'proyectos'
  | 'revision'
  | 'plantillas'
  | 'kit'
  | 'transferencia'
  | 'recursos'
  | 'administracion'
  | 'notificaciones'
  | 'configuracion'

export interface ModuleTheme {
  id: ModuleId
  label: string
  icon: string
  /** Color base (hex). */
  color: string
  /** Segundo color del degradado (hex). */
  to: string
}

export const MODULES: Record<ModuleId, ModuleTheme> = {
  inicio: { id: 'inicio', label: 'Inicio', icon: 'LayoutDashboard', color: '#0d9488', to: '#0891b2' },
  crear: { id: 'crear', label: 'Crear material', icon: 'Sparkle', color: '#2563eb', to: '#3b82f6' },
  proyectos: { id: 'proyectos', label: 'Mis proyectos', icon: 'FolderKanban', color: '#4f46e5', to: '#6366f1' },
  revision: { id: 'revision', label: 'Revisión', icon: 'ClipboardCheck', color: '#fb7185', to: '#f43f5e' },
  plantillas: { id: 'plantillas', label: 'Plantillas', icon: 'LayoutTemplate', color: '#7c3aed', to: '#8b5cf6' },
  kit: { id: 'kit', label: 'Kit Champion', icon: 'Sparkles', color: '#14b8a6', to: '#06b6d4' },
  transferencia: { id: 'transferencia', label: 'Transferencia', icon: 'Share2', color: '#10b981', to: '#34d399' },
  recursos: { id: 'recursos', label: 'Recursos', icon: 'BookOpen', color: '#0ea5e9', to: '#38bdf8' },
  administracion: { id: 'administracion', label: 'Administración', icon: 'ShieldHalf', color: '#475569', to: '#64748b' },
  notificaciones: { id: 'notificaciones', label: 'Notificaciones', icon: 'Bell', color: '#f59e0b', to: '#fbbf24' },
  configuracion: { id: 'configuracion', label: 'Configuración', icon: 'Settings', color: '#64748b', to: '#94a3b8' },
}

/** Degradado lineal del módulo. */
export function moduleGradient(m: ModuleTheme, angle = 135): string {
  return `linear-gradient(${angle}deg, ${m.color}, ${m.to})`
}

/** Fondo tenue con el color del módulo (para tarjetas y superficies). */
export function moduleSoft(m: ModuleTheme, alpha = 0.12): string {
  return hexA(m.color, alpha)
}

/** hex + alpha → rgba(). */
export function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Módulo asociado a una ruta, para acentos de navegación. */
export function moduleForPath(path: string): ModuleTheme {
  if (path === '/' ) return MODULES.inicio
  if (path.startsWith('/crear')) return MODULES.crear
  if (path.startsWith('/proyectos')) return MODULES.proyectos
  if (path.startsWith('/revision')) return MODULES.revision
  if (path.startsWith('/plantillas')) return MODULES.plantillas
  if (path.startsWith('/kit-champion')) return MODULES.kit
  if (path.startsWith('/transferencia') || path.startsWith('/produccion')) return MODULES.transferencia
  if (path.startsWith('/recursos')) return MODULES.recursos
  if (path.startsWith('/configuracion')) return MODULES.configuracion
  if (path.startsWith('/notificaciones')) return MODULES.notificaciones
  return MODULES.inicio
}
