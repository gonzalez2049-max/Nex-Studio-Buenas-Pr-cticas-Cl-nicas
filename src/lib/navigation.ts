import type { Role } from '@/lib/domain'

export interface NavItem {
  to: string
  label: string
  /** Nombre del icono de lucide-react. */
  icon: string
  /** Roles con acceso. `undefined` = todos. */
  roles?: Role[]
  /** Agrupación en la barra lateral. */
  group: 'principal' | 'produccion' | 'sistema'
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'LayoutDashboard', group: 'principal' },
  {
    to: '/crear',
    label: 'Crear material',
    icon: 'Plus',
    group: 'principal',
    roles: ['admin_ubpc', 'coordinador', 'profesional_ubpc'],
  },
  {
    to: '/proyectos',
    label: 'Mis proyectos',
    icon: 'FolderKanban',
    group: 'principal',
  },
  { to: '/plantillas', label: 'Plantillas', icon: 'LayoutTemplate', group: 'principal' },
  {
    to: '/kit-champion',
    label: 'Kit Champion',
    icon: 'Sparkles',
    group: 'principal',
    roles: ['admin_ubpc', 'coordinador', 'champion'],
  },
  { to: '/recursos', label: 'Recursos', icon: 'BookOpen', group: 'principal' },

  {
    to: '/transferencia',
    label: 'Registro de transferencia',
    icon: 'Share2',
    group: 'produccion',
  },
  {
    to: '/produccion',
    label: 'Producción UBPC',
    icon: 'Factory',
    group: 'produccion',
    roles: ['admin_ubpc', 'coordinador'],
  },

  {
    to: '/notificaciones',
    label: 'Notificaciones',
    icon: 'Bell',
    group: 'sistema',
  },
  { to: '/configuracion', label: 'Configuración', icon: 'Settings', group: 'sistema' },
]

export const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'principal', label: 'Estudio' },
  { id: 'produccion', label: 'Transferencia' },
  { id: 'sistema', label: 'Sistema' },
]

export function itemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role))
}
