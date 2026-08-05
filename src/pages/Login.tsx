import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { ROLES, ROLE_LABELS, type Role } from '@/lib/domain'
import { ConfigNotice } from '@/components/common/ConfigNotice'

export function LoginPage() {
  const { session, signIn, signUp, configured } = useAuth()
  const location = useLocation()
  const { toast } = useToast()
  const [mode, setMode] = React.useState<'login' | 'signup'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [role, setRole] = React.useState<Role>('profesional_ubpc')
  const [busy, setBusy] = React.useState(false)

  if (session) {
    const dest =
      (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
    return <Navigate to={dest} replace />
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configured) {
      toast({
        variant: 'destructive',
        title: 'Supabase no configurado',
        description: 'Añade las credenciales en .env para iniciar sesión.',
      })
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          toast({ variant: 'destructive', title: 'No se pudo iniciar sesión', description: error })
        }
      } else {
        const { error } = await signUp({ email, password, fullName, role })
        if (error) {
          toast({ variant: 'destructive', title: 'No se pudo registrar', description: error })
        } else {
          toast({
            variant: 'success',
            title: 'Cuenta creada',
            description: 'Revisa tu correo si se requiere confirmación, luego inicia sesión.',
          })
          setMode('login')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel de marca */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-xl font-bold">N</span>
          </div>
          <span className="text-lg font-semibold">NEX Studio</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            El estudio editorial de las Buenas Prácticas Clínicas
          </h1>
          <p className="max-w-md text-sidebar-foreground/70">
            Crea, edita, valida, publica y transfiere materiales de conocimiento
            de la UBPC con un flujo institucional real: borrador, revisión,
            aprobación y publicación.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/40">
          Unidad de Buenas Prácticas Clínicas
        </p>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-bold">N</span>
              </div>
              <span className="font-semibold">NEX Studio</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Accede a tu estudio de transferencia del conocimiento.'
                : 'Regístrate para empezar a producir materiales.'}
            </p>
          </div>

          <ConfigNotice />

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Ana Pérez"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo institucional</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ubpc.org"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Un administrador puede ajustar tu rol más adelante.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? 'Procesando…'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
