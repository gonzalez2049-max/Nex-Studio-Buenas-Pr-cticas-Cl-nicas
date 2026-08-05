-- =============================================================================
-- NEX Studio · Row Level Security
-- Modelo de seguridad por rol. La lógica de flujo se refuerza en la app; aquí
-- se define quién puede leer/escribir cada recurso.
-- =============================================================================

-- Habilitar RLS en todas las tablas.
alter table public.profiles        enable row level security;
alter table public.templates       enable row level security;
alter table public.projects        enable row level security;
alter table public.observations    enable row level security;
alter table public.transfer_records enable row level security;
alter table public.resources       enable row level security;
alter table public.notifications   enable row level security;
alter table public.activity_log    enable row level security;

-- ------------------------------------------------------------- Helpers -------

-- ¿El usuario actual es personal de gestión (admin o coordinador)?
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('admin_ubpc', 'coordinador');
$$;

-- ¿Puede el usuario actual ver este proyecto?
create or replace function public.can_view_project(pid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.projects p
    where p.id = pid
      and (
        p.status = 'publicado'
        or p.owner_id = auth.uid()
        or p.assigned_reviewer_id = auth.uid()
        or public.current_user_role() in ('admin_ubpc', 'coordinador', 'revisor')
      )
  );
$$;

-- --------------------------------------------------------------- Perfiles ----

-- Todos los usuarios autenticados pueden ver los perfiles (nombres, roles).
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

-- Cada usuario edita su propio perfil.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Los administradores pueden editar cualquier perfil (p. ej. cambiar rol).
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'admin_ubpc')
  with check (public.current_user_role() = 'admin_ubpc');

-- -------------------------------------------------------------- Plantillas ---

create policy templates_select on public.templates
  for select to authenticated
  using (true);

create policy templates_write on public.templates
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --------------------------------------------------------------- Proyectos ---

create policy projects_select on public.projects
  for select to authenticated
  using (
    status = 'publicado'
    or owner_id = auth.uid()
    or assigned_reviewer_id = auth.uid()
    or public.current_user_role() in ('admin_ubpc', 'coordinador', 'revisor')
  );

-- Crear: roles productores, siempre como propietario.
create policy projects_insert on public.projects
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.current_user_role() in
      ('admin_ubpc', 'coordinador', 'profesional_ubpc')
  );

-- Actualizar: propietario, revisor asignado o personal de gestión.
create policy projects_update on public.projects
  for update to authenticated
  using (
    owner_id = auth.uid()
    or assigned_reviewer_id = auth.uid()
    or public.is_staff()
  )
  with check (
    owner_id = auth.uid()
    or assigned_reviewer_id = auth.uid()
    or public.is_staff()
  );

-- Eliminar: propietario o personal de gestión.
create policy projects_delete on public.projects
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------ Observaciones --

create policy observations_select on public.observations
  for select to authenticated
  using (public.can_view_project(project_id));

create policy observations_insert on public.observations
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.current_user_role() in ('admin_ubpc', 'coordinador', 'revisor')
  );

create policy observations_update on public.observations
  for update to authenticated
  using (
    author_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (true);

-- ---------------------------------------------------- Registro transferencia -

create policy transfer_select on public.transfer_records
  for select to authenticated
  using (true);

create policy transfer_insert on public.transfer_records
  for insert to authenticated
  with check (
    transferred_by = auth.uid()
    and public.current_user_role() <> 'visualizador'
  );

create policy transfer_update on public.transfer_records
  for update to authenticated
  using (transferred_by = auth.uid() or public.is_staff())
  with check (true);

-- ---------------------------------------------------------------- Recursos ---

create policy resources_select on public.resources
  for select to authenticated
  using (true);

create policy resources_write on public.resources
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ----------------------------------------------------------- Notificaciones --

-- Cada usuario ve sólo sus notificaciones.
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- Cualquier usuario autenticado puede generar notificaciones (p. ej. avisar a
-- un revisor al enviar a revisión).
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check (auth.uid() is not null);

-- Cada usuario marca como leídas sólo las suyas.
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------- Actividad -----

create policy activity_select on public.activity_log
  for select to authenticated
  using (true);

create policy activity_insert on public.activity_log
  for insert to authenticated
  with check (actor_id = auth.uid() or actor_id is null);
