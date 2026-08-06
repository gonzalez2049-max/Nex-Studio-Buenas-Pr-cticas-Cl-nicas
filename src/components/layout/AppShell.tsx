import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Eye, X } from 'lucide-react'
import { SidebarBrand, SidebarNav } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/domain'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { impersonatedRole, setImpersonatedRole } = useAuth()

  return (
    <div className="app-canvas flex min-h-screen">
      {/* Sidebar fijo (escritorio) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar lg:flex">
        <SidebarBrand />
        <SidebarNav />
        <div className="px-5 py-4 text-[11px] text-sidebar-foreground/40">
          NEX Studio · v0.1
        </div>
      </aside>

      {/* Sidebar móvil (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand />
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className={cn('flex min-h-screen flex-1 flex-col lg:pl-64')}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        {impersonatedRole && (
          <div className="flex items-center justify-center gap-3 bg-slate-800 px-4 py-2 text-sm text-white">
            <Eye className="h-4 w-4" />
            <span>
              Vista temporal como{' '}
              <span className="font-semibold">{ROLE_LABELS[impersonatedRole]}</span>
            </span>
            <button
              onClick={() => setImpersonatedRole(null)}
              className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/25"
            >
              Volver a mi rol
            </button>
          </div>
        )}
        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
