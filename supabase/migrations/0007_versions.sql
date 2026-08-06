-- =============================================================================
-- NEX Studio · Historial de versiones
-- Instantáneas del contenido para revisar el historial y recuperar versiones.
-- =============================================================================

create table if not exists public.project_versions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version    int not null,
  content    jsonb not null,
  status     public.project_status,
  note       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_versions_project
  on public.project_versions (project_id, created_at desc);

alter table public.project_versions enable row level security;

-- Ver versiones: quien pueda ver el proyecto.
create policy versions_select on public.project_versions
  for select to authenticated
  using (public.can_view_project(project_id));

-- Crear versión: autores/gestión sobre proyectos que pueden editar.
create policy versions_insert on public.project_versions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_view_project(project_id)
    and public.current_user_role() in
      ('admin_ubpc', 'coordinador', 'profesional_ubpc')
  );
