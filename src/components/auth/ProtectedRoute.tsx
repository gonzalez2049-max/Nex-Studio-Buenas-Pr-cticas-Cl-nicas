import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/domain'
import type { Role } from '@/lib/domain'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando NEX Studio…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, configured } = useAuth()
  const location = useLocation()

  // Sin credenciales de Supabase permitimos ver la app en modo demo/config.
  if (!configured) return <>{children}</>
  if (loading) return <FullScreenLoader />
  if (!session)
    return <Navigate to="/login" replace state={{ from: location }} />

  return <>{children}</>
}

/**
 * Restringe el contenido a determinados permisos de rol. Si no se cumplen,
 * redirige al inicio.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: (role: Role) => boolean
  children: React.ReactNode
}) {
  // Usa el rol efectivo (respeta la «vista temporal»), también en modo demo,
  // para que previsualizar como Profesional restrinja realmente el acceso.
  const role = useRole()
  if (!allow(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export { PERMISSIONS }
