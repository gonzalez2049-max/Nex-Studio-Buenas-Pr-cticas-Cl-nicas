-- =============================================================================
-- NEX Studio · Almacenamiento (Supabase Storage)
-- Bucket para miniaturas y activos de materiales.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

-- Lectura pública de los activos del bucket (materiales publicados/miniaturas).
create policy "materials_public_read"
  on storage.objects for select
  using (bucket_id = 'materials');

-- Subida y gestión sólo para usuarios autenticados no visualizadores.
create policy "materials_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materials'
    and public.current_user_role() <> 'visualizador'
  );

create policy "materials_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'materials' and owner = auth.uid())
  with check (bucket_id = 'materials');

create policy "materials_authenticated_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'materials'
    and (owner = auth.uid() or public.is_staff())
  );
