import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { cn } from '@/lib/utils'
import { itemsForRole, NAV_GROUPS } from '@/lib/navigation'
import { useRole } from '@/contexts/AuthContext'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const role = useRole()
  const items = itemsForRole(role)

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group.id)
        if (groupItems.length === 0) return null
        return (
          <div key={group.id}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
            <ul className="space-y-1">
              {groupItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground',
                      )
                    }
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-lg font-bold leading-none">N</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-sidebar-foreground">
          NEX Studio
        </p>
        <p className="text-[11px] text-sidebar-foreground/50">
          Buenas Prácticas Clínicas
        </p>
      </div>
    </div>
  )
}
