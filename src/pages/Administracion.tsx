import { Link } from 'react-router-dom'
import { ModuleHero } from '@/components/common/ModuleHero'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { Icon } from '@/components/common/Icon'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useDashboardMetrics,
  useGenerateSampleData,
  useProfiles,
  useProjects,
  useTemplates,
  useUpdateProfileRole,
} from '@/hooks/queries'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/hooks/use-toast'
import { MODULES } from '@/lib/modules'
import { cn, initials } from '@/lib/utils'
import {
  PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  type Role,
} from '@/lib/domain'

const M = MODULES.administracion

export function AdminPage() {
  return (
    <>
      <ModuleHero
        module={M}
        eyebrow="Gobierno de la unidad"
        title="Administración"
        subtitle="Usuarios y permisos, plantillas, producción, códigos institucionales y configuración."
        compact
      />
      <ConfigNotice />

      <ImpersonationBar />

      <div className="grid gap-5 lg:grid-cols-3">
        <InstitutionCard
          to="/plantillas"
          icon="LayoutTemplate"
          color={MODULES.plantillas.color}
          title="Gestión de plantillas"
          value={useTemplatesCount()}
          label="plantillas disponibles"
        />
        <ProductionCard />
        <SampleDataCard />
      </div>

      <UsersAndPermissions />

      <div className="grid gap-5 lg:grid-cols-2">
        <InstitutionalCodes />
        <VisualConfig />
      </div>
    </>
  )
}

function useTemplatesCount() {
  const { data } = useTemplates()
  return data?.length ?? 0
}

/* --------------------------------------------------- vista temporal (rol) --- */

function ImpersonationBar() {
  const { impersonatedRole, setImpersonatedRole } = useAuth()
  const effective = useRole()
  const roles: Role[] = ['champion', 'revisor', 'profesional_ubpc']

  return (
    <div className="rounded-2xl border bg-card p-4 surface">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${M.color}1f`, color: M.color }}
        >
          <Icon name="Eye" className="h-4 w-4" />
        </span>
        <div className="mr-auto">
          <p className="text-sm font-semibold">Vista temporal como rol</p>
          <p className="text-xs text-muted-foreground">
            Previsualiza la interfaz con los permisos de otro rol. Rol efectivo actual:{' '}
            <span className="font-medium text-foreground">{ROLE_LABELS[effective]}</span>
            {impersonatedRole && ' (simulado)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setImpersonatedRole(r)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                impersonatedRole === r ? 'text-white' : 'hover:bg-accent',
              )}
              style={impersonatedRole === r ? { background: M.color, borderColor: M.color } : undefined}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
          {impersonatedRole && (
            <Button variant="ghost" size="sm" onClick={() => setImpersonatedRole(null)}>
              <Icon name="RotateCcw" className="h-4 w-4" />
              Volver a mi rol
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- tarjetas hub --- */

function InstitutionCard({
  to,
  icon,
  color,
  title,
  value,
  label,
}: {
  to: string
  icon: string
  color: string
  title: string
  value: number
  label: string
}) {
  return (
    <Link to={to} className="group rounded-2xl border bg-card p-5 surface transition-all hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${color}1f`, color }}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <Icon name="ArrowUpRight" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  )
}

function ProductionCard() {
  const { data } = useDashboardMetrics()
  return (
    <InstitutionCard
      to="/produccion"
      icon="Factory"
      color={MODULES.transferencia.color}
      title="Producción UBPC"
      value={data?.total ?? 0}
      label="materiales en la línea"
    />
  )
}

function SampleDataCard() {
  const { toast } = useToast()
  const generate = useGenerateSampleData()
  return (
    <div className="rounded-2xl border bg-card p-5 surface">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${M.color}1f`, color: M.color }}>
        <Icon name="Database" className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium">Datos de prueba</p>
      <p className="text-xs text-muted-foreground">
        Genera materiales de ejemplo recorriendo el flujo, con versiones y transferencias.
      </p>
      <Button
        className="mt-3 w-full"
        disabled={generate.isPending}
        onClick={async () => {
          try {
            const res = await generate.mutateAsync()
            toast({ variant: 'success', title: 'Datos generados', description: `${res.created} materiales.` })
          } catch (e) {
            toast({ variant: 'destructive', title: 'No se pudo generar', description: e instanceof Error ? e.message : 'Conecta Supabase.' })
          }
        }}
      >
        <Icon name="Sparkles" className="h-4 w-4" />
        {generate.isPending ? 'Generando…' : 'Generar datos de prueba'}
      </Button>
    </div>
  )
}

/* ------------------------------------------------ usuarios, roles, permisos --- */

const CAPS: { key: keyof typeof PERMISSIONS; label: string }[] = [
  { key: 'canCreateMaterial', label: 'Crear' },
  { key: 'canReview', label: 'Revisar' },
  { key: 'canApprove', label: 'Aprobar' },
  { key: 'canPublish', label: 'Publicar' },
  { key: 'canManageTemplates', label: 'Plantillas' },
  { key: 'canAccessChampionKit', label: 'Kit' },
  { key: 'canViewProduction', label: 'Producción' },
  { key: 'canManageUsers', label: 'Usuarios' },
]

function UsersAndPermissions() {
  const { data: profiles, isLoading } = useProfiles()
  const updateRole = useUpdateProfileRole()
  const { toast } = useToast()
  const { profile: me } = useAuth()

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Usuarios */}
      <Card className="rounded-2xl surface">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b p-4">
            <Icon name="Users" className="h-4 w-4" style={{ color: M.color }} />
            <p className="text-sm font-semibold">Usuarios y roles</p>
          </div>
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
              {(profiles ?? []).map((p) => (
                <div key={p.id} className="flex items-center gap-3 border-b p-3 last:border-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(p.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.full_name ?? '—'}
                      {p.id === me?.id && <span className="ml-1 text-xs text-muted-foreground">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Select
                    value={p.role}
                    onValueChange={async (v) => {
                      try {
                        await updateRole.mutateAsync({ id: p.id, role: v as Role })
                        toast({ variant: 'success', title: 'Rol actualizado' })
                      } catch (e) {
                        toast({ variant: 'destructive', title: 'No se pudo', description: e instanceof Error ? e.message : 'Conecta Supabase.' })
                      }
                    }}
                  >
                    <SelectTrigger className="w-[170px] border-0 bg-muted/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matriz de permisos */}
      <Card className="rounded-2xl surface">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b p-4">
            <Icon name="KeyRound" className="h-4 w-4" style={{ color: M.color }} />
            <p className="text-sm font-semibold">Permisos por rol</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-medium">Rol</th>
                  {CAPS.map((c) => (
                    <th key={c.key} className="p-2 text-center font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r} className="border-t">
                    <td className="p-3">
                      <RoleBadge role={r} />
                    </td>
                    {CAPS.map((c) => {
                      const ok = PERMISSIONS[c.key](r)
                      return (
                        <td key={c.key} className="p-2 text-center">
                          {ok ? (
                            <Icon name="Check" className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* --------------------------------------------------- códigos institucionales --- */

function InstitutionalCodes() {
  const { data: projects } = useProjects({})
  const withCode = (projects ?? []).filter((p) => p.code).slice(0, 6)

  return (
    <Card className="rounded-2xl surface">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Icon name="Hash" className="h-4 w-4" style={{ color: M.color }} />
          <p className="text-sm font-semibold">Códigos institucionales</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Formato automático{' '}
          <code className="rounded bg-muted px-1 font-mono">UBPC-TIPO-AÑO-CORRELATIVO</code>. Se
          asigna en la base de datos al crear cada material.
        </p>
        <div className="space-y-1.5">
          {withCode.length > 0 ? (
            withCode.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="font-mono text-xs">{p.code}</span>
                <span className="truncate pl-3 text-xs text-muted-foreground">{p.title}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Sin códigos todavía.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------- configuración visual --- */

function VisualConfig() {
  const { theme, setTheme } = useTheme()
  const modules = Object.values(MODULES).slice(0, 8)
  return (
    <Card className="rounded-2xl surface">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Icon name="Palette" className="h-4 w-4" style={{ color: M.color }} />
          <p className="text-sm font-semibold">Configuración visual</p>
        </div>
        <div className="grid max-w-xs grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors',
                theme === t && 'ring-2 ring-primary/40',
              )}
            >
              <Icon name={t === 'light' ? 'Sun' : 'Moon'} className="h-4 w-4" style={{ color: M.color }} />
              {t === 'light' ? 'Claro' : 'Oscuro'}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Colores por módulo</p>
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
