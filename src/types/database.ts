import type { MaterialFormat, ProjectState, Role } from '@/lib/domain'

/**
 * Tipos que reflejan el esquema de Supabase (`supabase/migrations`).
 * Se mantienen manualmente en sincronía con las tablas.
 */

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  unit: string | null
  job_title: string | null
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  format: MaterialFormat
  category: string | null
  content: Record<string, unknown>
  thumbnail_url: string | null
  is_official: boolean
  created_by: string | null
  created_at: string
}

export type ProjectAccess = 'privado' | 'enlace' | 'restringido'

export interface Project {
  id: string
  code: string | null
  title: string
  description: string | null
  format: MaterialFormat
  status: ProjectState
  access: ProjectAccess
  template_id: string | null
  content: Record<string, unknown>
  owner_id: string
  assigned_reviewer_id: string | null
  thumbnail_url: string | null
  tags: string[]
  version: number
  /** Ficha de cierre del producto (resumen + firma + envío). */
  closure: import('@/lib/closure').ClosureCard | null
  published_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ProjectVersion {
  id: string
  project_id: string
  version: number
  content: Record<string, unknown>
  status: ProjectState | null
  note: string | null
  created_by: string | null
  created_at: string
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

/** Proyecto con relaciones expandidas para listados y detalle. */
export interface ProjectWithRelations extends Project {
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'> | null
  reviewer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  template?: Pick<Template, 'id' | 'name'> | null
}

export interface Observation {
  id: string
  project_id: string
  author_id: string
  body: string
  resolved: boolean
  created_at: string
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'> | null
}

export interface TransferRecord {
  id: string
  project_id: string
  channel: string
  audience: string | null
  reach: number
  transferred_by: string
  transferred_at: string
  notes: string | null
  project?: Pick<Project, 'id' | 'title' | 'format'> | null
}

export interface Resource {
  id: string
  title: string
  description: string | null
  kind: string
  url: string | null
  category: string | null
  is_champion_kit: boolean
  created_by: string | null
  created_at: string
}

export type NotificationType =
  | 'review_requested'
  | 'observation_added'
  | 'approved'
  | 'published'
  | 'assigned'
  | 'expiring'
  | 'system'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  project_id: string | null
  actor_id: string | null
  action: string
  from_status: ProjectState | null
  to_status: ProjectState | null
  meta: Record<string, unknown> | null
  created_at: string
  actor?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}
