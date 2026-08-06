import * as React from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import type { Role } from '@/lib/domain'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (args: {
    email: string
    password: string
    fullName: string
    role?: Role
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
  /** Rol de «vista temporal» (impersonación) para previsualizar la interfaz. */
  impersonatedRole: Role | null
  setImpersonatedRole: (role: Role | null) => void
}

const AuthContext = React.createContext<AuthState | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('No se pudo cargar el perfil:', error.message)
    return null
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [impersonatedRole, setImpersonatedRole] = React.useState<Role | null>(
    null,
  )

  const loadProfile = React.useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(userId)
    setProfile(p)
  }, [])

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession)
        await loadProfile(nextSession?.user.id)
        setLoading(false)
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = React.useCallback<AuthState['signIn']>(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signUp = React.useCallback<AuthState['signUp']>(
    async ({ email, password, fullName, role = 'profesional_ubpc' }) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  const refreshProfile = React.useCallback(async () => {
    await loadProfile(session?.user.id)
  }, [loadProfile, session?.user.id])

  const updateProfile = React.useCallback<AuthState['updateProfile']>(
    async (patch) => {
      if (!session?.user.id) return { error: 'Sin sesión' }
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
      if (!error) await refreshProfile()
      return { error: error?.message ?? null }
    },
    [session?.user.id, refreshProfile],
  )

  const value = React.useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
      impersonatedRole,
      setImpersonatedRole,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile, updateProfile, impersonatedRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

/**
 * Rol efectivo para la interfaz. Prioriza la «vista temporal» (impersonación);
 * en modo demo (sin Supabase) usa administrador para exponer todas las áreas.
 */
export function useRole(): Role {
  const { profile, configured, impersonatedRole } = useAuth()
  if (impersonatedRole) return impersonatedRole
  if (!configured) return 'coordinador'
  return profile?.role ?? 'profesional_ubpc'
}
