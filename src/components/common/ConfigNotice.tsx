import { AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Aviso persistente cuando faltan credenciales de Supabase. La app sigue
 * navegable pero sin datos reales; esto explica cómo activarla.
 */
export function ConfigNotice() {
  if (isSupabaseConfigured) return null
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">Supabase no está configurado</p>
        <p className="text-amber-800/90 dark:text-amber-200/90">
          Copia <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.example</code>{' '}
          a <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env</code>, añade tu{' '}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, y
          ejecuta las migraciones de <code>supabase/migrations</code>. Mientras
          tanto la persistencia y la autenticación están deshabilitadas.
        </p>
      </div>
    </div>
  )
}
