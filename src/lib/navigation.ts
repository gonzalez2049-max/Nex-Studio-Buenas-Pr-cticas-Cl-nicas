import type { Role } from '@/lib/domain'

export interface NavItem {
  to: string
  label: string
  /** Nombre del icono de lucide-react. */
  icon: string
  /** Color de acento del módulo (hex). */
  color: string
  /** Roles con acceso. `undefined` = todos. */
  roles?: Role[]
  /** Agrupación en la barra lateral. */
  group: 'principal' | 'produccion' | 'sistema'
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'LayoutDashboard', color: '#0d9488', group: 'principal' },
  {
    to: '/crear',
    label: 'Crear material',
    icon: 'Plus',
    color: '#2563eb',
    group: 'principal',
    roles: ['admin_ubpc', 'coordinador', 'profesional_ubpc'],
  },
  {
    to: '/proyectos',
    label: 'Mis proyectos',
    icon: 'FolderKanban',
    color: '#4f46e5',
    group: 'principal',
  },
  { to: '/plantillas', label: 'Plantillas', icon: 'LayoutTemplate', color: '#7c3aed', group: 'principal' },
  {
    to: '/kit-champion',
    label: 'Kit Champion',
    icon: 'Sparkles',
    color: '#14b8a6',
    group: 'principal',
    roles: ['admin_ubpc', 'coordinador', 'champion'],
  },
  { to: '/recursos', label: 'Recursos', icon: 'BookOpen', color: '#0ea5e9', group: 'principal' },

  {
    to: '/transferencia',
    label: 'Registro de transferencia',
    icon: 'Share2',
    color: '#10b981',
    group: 'produccion',
  },
  {
    to: '/produccion',
    label: 'Producción UBPC',
    icon: 'Factory',
    color: '#10b981',
    group: 'produccion',
    roles: ['admin_ubpc', 'coordinador'],
  },

  {
    to: '/notificaciones',
    label: 'Notificaciones',
    icon: 'Bell',
    color: '#f59e0b',
    group: 'sistema',
  },
  { to: '/configuracion', label: 'Configuración', icon: 'Settings', color: '#64748b', group: 'sistema' },
]

export const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'principal', label: 'Estudio' },
  { id: 'produccion', label: 'Transferencia' },
  { id: 'sistema', label: 'Sistema' },
]

export function itemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role))
}
