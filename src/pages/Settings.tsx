import * as React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfigNotice } from '@/components/common/ConfigNotice'
import { Icon } from '@/components/common/Icon'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Link } from 'react-router-dom'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  useDashboardMetrics,
  useGenerateSampleData,
  useProfiles,
  useUpdateProfileRole,
} from '@/hooks/queries'
import { useToast } from '@/hooks/use-toast'
import {
  PERMISSIONS,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Role,
} from '@/lib/domain'
import { initials } from '@/lib/utils'

export function SettingsPage() {
  const role = useRole()
  const canManage = PERMISSIONS.canManageUsers(role)

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Perfil, apariencia y administración institucional."
      />
      <ConfigNotice />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          {canManage && <TabsTrigger value="users">Usuarios</TabsTrigger>}
          {canManage && <TabsTrigger value="admin">Administración</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="roles">
          <RolesReference />
        </TabsContent>
        {canManage && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
        {canManage && (
          <TabsContent value="admin">
            <AdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}

function ProfileSettings() {
  const { profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [fullName, setFullName] = React.useState(profile?.full_name ?? '')
  const [unit, setUnit] = React.useState(profile?.unit ?? '')
  const [jobTitle, setJobTitle] = React.useState(profile?.job_title ?? '')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setUnit(profile?.unit ?? '')
    setJobTitle(profile?.job_title ?? '')
  }, [profile])

  const save = async () => {
    setSaving(true)
    const { error } = await updateProfile({
      full_name: fullName,
      unit,
      job_title: jobTitle,
    })
    setSaving(false)
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo guardar', description: error })
    } else {
      toast({ variant: 'success', title: 'Perfil actualizado' })
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">
              {initials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{profile?.full_name ?? 'Usuario'}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            {profile && (
              <div className="mt-1">
                <RoleBadge role={profile.role} />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fn">Nombre completo</Label>
            <Input
              id="fn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jt">Cargo</Label>
            <Input
              id="jt"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ej. Médico especialista"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="un">Unidad / servicio</Label>
            <Input
              id="un"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ej. UBPC — Medicina Interna"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Icon name="Save" className="h-4 w-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="text-sm font-medium">Tema de la interfaz</p>
          <p className="text-sm text-muted-foreground">
            Elige entre claro y oscuro. Se recuerda en este dispositivo.
          </p>
        </div>
        <div className="grid max-w-md grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                theme === t ? 'border-primary ring-2 ring-primary/30' : ''
              }`}
            >
              <Icon
                name={t === 'light' ? 'Sun' : 'Moon'}
                className="h-5 w-5 text-primary"
              />
              <span className="text-sm font-medium">
                {t === 'light' ? 'Claro' : 'Oscuro'}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RolesReference() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ROLES.map((r) => (
        <Card key={r}>
          <CardContent className="space-y-2 p-5">
            <RoleBadge role={r} />
            <p className="text-sm text-muted-foreground">
              {ROLE_DESCRIPTIONS[r]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function UserManagement() {
  const { data: profiles, isLoading } = useProfiles()
  const updateRole = useUpdateProfileRole()
  const { toast } = useToast()
  const { profile: me } = useAuth()

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando usuarios…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {initials(p.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {p.full_name ?? '—'}
                          {p.id === me?.id && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (tú)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.email}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={p.role}
                        onValueChange={async (v) => {
                          try {
                            await updateRole.mutateAsync({
                              id: p.id,
                              role: v as Role,
                            })
                            toast({
                              variant: 'success',
                              title: 'Rol actualizado',
                              description: `${p.full_name ?? p.email} → ${ROLE_LABELS[v as Role]}`,
                            })
                          } catch (e) {
                            toast({
                              variant: 'destructive',
                              title: 'No se pudo actualizar',
                              description:
                                e instanceof Error ? e.message : 'Error',
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="w-[190px]">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AdminPanel() {
  const { toast } = useToast()
  const generate = useGenerateSampleData()
  const { data: metrics } = useDashboardMetrics()

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-base font-semibold">Vista de administración</p>
            <p className="text-sm text-muted-foreground">
              Resumen institucional de la producción de la unidad.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Materiales', value: metrics?.total ?? 0 },
              { label: 'Pendientes', value: metrics?.pendingReview ?? 0 },
              { label: 'Publicados', value: metrics?.published ?? 0 },
              { label: 'Por vencer', value: metrics?.expiringSoon ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border p-4">
                <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/produccion">
                <Icon name="Factory" className="h-4 w-4" />
                Producción UBPC
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/transferencia">
                <Icon name="Share2" className="h-4 w-4" />
                Registro de transferencia
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div>
            <p className="text-base font-semibold">Datos de prueba</p>
            <p className="text-sm text-muted-foreground">
              Genera materiales de ejemplo (persistencia real) recorriendo el
              flujo editorial, con versiones, observaciones y transferencias.
            </p>
          </div>
          <Button
            disabled={generate.isPending}
            onClick={async () => {
              try {
                const res = await generate.mutateAsync()
                toast({
                  variant: 'success',
                  title: 'Datos de prueba generados',
                  description: `${res.created} materiales creados.`,
                })
              } catch (e) {
                toast({
                  variant: 'destructive',
                  title: 'No se pudieron generar',
                  description: e instanceof Error ? e.message : 'Error',
                })
              }
            }}
          >
            <Icon name="Database" className="h-4 w-4" />
            {generate.isPending ? 'Generando…' : 'Generar datos de prueba'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
