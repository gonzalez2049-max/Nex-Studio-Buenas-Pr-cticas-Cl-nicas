-- =============================================================================
-- NEX Studio · Formatos Díptico y Ficha rápida
-- Añade dos formatos con estructura, dimensiones y editor propios.
-- =============================================================================

alter type public.material_format add value if not exists 'diptico';
alter type public.material_format add value if not exists 'ficha_rapida';

-- Amplía el prefijo de código para los nuevos formatos.
create or replace function public.format_code(fmt public.material_format)
returns text language sql immutable as $$
  select case fmt
    when 'presentacion'  then 'PRES'
    when 'infografia'    then 'INFO'
    when 'triptico'      then 'TRIP'
    when 'diptico'       then 'DIP'
    when 'kit_champion'  then 'KIT'
    when 'checklist'     then 'CHK'
    when 'boletin'       then 'EVI'
    when 'video_guion'   then 'CAP'
    when 'poster'        then 'AFI'
    when 'ficha_tecnica' then 'TARJ'
    when 'ficha_rapida'  then 'FRAP'
    when 'flujograma'    then 'FLU'
    when 'mapa_mental'   then 'MAPA'
    when 'reloj_posicion' then 'RELOJ'
    when 'documento'     then 'DOC'
    else 'MAT'
  end;
$$;
