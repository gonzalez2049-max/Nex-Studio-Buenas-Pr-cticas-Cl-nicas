-- =============================================================================
-- NEX Studio · Esquema base
-- Plataforma institucional de transferencia del conocimiento (UBPC)
-- =============================================================================

-- ----------------------------------------------------------------- Enums ----

create type public.user_role as enum (
  'admin_ubpc',
  'coordinador',
  'profesional_ubpc',
  'champion',
  'revisor',
  'visualizador'
);

create type public.project_status as enum (
  'borrador',
  'en_edicion',
  'pendiente_revision',
  'con_observaciones',
  'aprobado',
  'publicado',
  'archivado',
  'vencido'
);

create type public.material_format as enum (
  'infografia',
  'poster',
  'presentacion',
  'ficha_tecnica',
  'boletin',
  'video_guion',
  'checklist',
  'documento'
);

create type public.notification_type as enum (
  'review_requested',
  'observation_added',
  'approved',
  'published',
  'assigned',
  'expiring',
  'system'
);

-- --------------------------------------------------------------- Utilidad ----

-- Mantiene updated_at en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- Perfiles ---

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'profesional_ubpc',
  unit        text,
  job_title   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Rol del usuario autenticado, sin recursión de RLS (SECURITY DEFINER).
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Crea automáticamente el perfil cuando se registra un usuario en auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'profesional_ubpc'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- Plantillas ---

create table public.templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  format       public.material_format not null,
  category     text,
  content      jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  is_official  boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- Proyectos ---

create table public.projects (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  format                public.material_format not null,
  status                public.project_status not null default 'borrador',
  template_id           uuid references public.templates (id) on delete set null,
  content               jsonb not null default '{}'::jsonb,
  owner_id              uuid not null references public.profiles (id) on delete cascade,
  assigned_reviewer_id  uuid references public.profiles (id) on delete set null,
  thumbnail_url         text,
  tags                  text[] not null default '{}',
  version               integer not null default 1,
  published_at          timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_projects_owner on public.projects (owner_id);
create index idx_projects_status on public.projects (status);
create index idx_projects_reviewer on public.projects (assigned_reviewer_id);

create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ Observaciones --

create table public.observations (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_observations_project on public.observations (project_id);

-- ---------------------------------------------------- Registro transferencia -

create table public.transfer_records (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  channel        text not null,
  audience       text,
  reach          integer not null default 0,
  transferred_by uuid not null references public.profiles (id) on delete cascade,
  transferred_at timestamptz not null default now(),
  notes          text
);

create index idx_transfer_project on public.transfer_records (project_id);

-- ---------------------------------------------------------------- Recursos ---

create table public.resources (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  kind            text not null default 'documento',
  url             text,
  category        text,
  is_champion_kit boolean not null default false,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------- Notificaciones --

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null default 'system',
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, read);

-- ------------------------------------------------------------- Actividad -----

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  from_status public.project_status,
  to_status   public.project_status,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index idx_activity_project on public.activity_log (project_id);
create index idx_activity_created on public.activity_log (created_at desc);
