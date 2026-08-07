-- =============================================================================
-- NEX Studio · Ficha de cierre del producto
-- Tarjeta resumen que el Profesional firma y envía al Coordinador. Queda
-- guardada en el propio proyecto como respaldo institucional.
-- =============================================================================

alter table public.projects add column if not exists closure jsonb;

comment on column public.projects.closure is
  'Ficha de cierre del producto (resumen + firma electrónica + envío).';
