import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * `true` cuando el proyecto tiene credenciales de Supabase configuradas.
 * La app arranca igualmente sin ellas y muestra un aviso de configuración,
 * en lugar de romperse en blanco.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente de Supabase. Si faltan credenciales usamos valores marcadores para
 * que `createClient` no lance; ninguna consulta funcionará hasta configurarlas.
 */
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
