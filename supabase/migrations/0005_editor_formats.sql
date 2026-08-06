-- =============================================================================
-- NEX Studio · Nuevos formatos del editor
-- Amplía el enum material_format con los formatos con editor propio.
-- =============================================================================

alter type public.material_format add value if not exists 'triptico';
alter type public.material_format add value if not exists 'kit_champion';
alter type public.material_format add value if not exists 'flujograma';
alter type public.material_format add value if not exists 'mapa_mental';
alter type public.material_format add value if not exists 'reloj_posicion';
