-- =============================================================================
-- NEX Studio · Códigos institucionales y control de acceso
-- Código automático UBPC-TIPO-AÑO-CORRELATIVO y nivel de acceso por material.
-- =============================================================================

alter table public.projects add column if not exists code text;
alter table public.projects
  add column if not exists access text not null default 'privado';
-- access: 'privado' (solo la unidad), 'enlace' (cualquiera con el enlace),
--         'restringido' (enlace + registro requerido).

create unique index if not exists idx_projects_code
  on public.projects (code) where code is not null;

-- Contadores por prefijo y año para el correlativo.
create table if not exists public.project_counters (
  prefix text not null,
  year   int  not null,
  seq    int  not null default 0,
  primary key (prefix, year)
);
alter table public.project_counters enable row level security;
-- Sin políticas: sólo la función SECURITY DEFINER escribe aquí.

-- Abreviatura de tipo para el código.
create or replace function public.format_code(fmt public.material_format)
returns text language sql immutable as $$
  select case fmt
    when 'presentacion'  then 'PRES'
    when 'infografia'    then 'INFO'
    when 'triptico'      then 'TRIP'
    when 'kit_champion'  then 'KIT'
    when 'checklist'     then 'CHK'
    when 'boletin'       then 'EVI'
    when 'video_guion'   then 'CAP'
    when 'poster'        then 'AFI'
    when 'ficha_tecnica' then 'FICHA'
    when 'flujograma'    then 'FLU'
    when 'mapa_mental'   then 'MAPA'
    when 'reloj_posicion' then 'RELOJ'
    when 'documento'     then 'DOC'
    else 'MAT'
  end;
$$;

-- Asigna el código en la inserción si no viene dado.
create or replace function public.assign_project_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pfx text;
  yr  int := extract(year from now());
  n   int;
begin
  if new.code is not null and new.code <> '' then
    return new;
  end if;
  pfx := public.format_code(new.format);
  insert into public.project_counters (prefix, year, seq)
    values (pfx, yr, 1)
    on conflict (prefix, year)
      do update set seq = public.project_counters.seq + 1
    returning seq into n;
  new.code := 'UBPC-' || pfx || '-' || yr::text || '-' || lpad(n::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_assign_project_code on public.projects;
create trigger trg_assign_project_code
  before insert on public.projects
  for each row execute function public.assign_project_code();

-- Backfill de códigos para materiales existentes.
do $$
declare r record; pfx text; yr int; n int;
begin
  for r in select id, format, created_at from public.projects
           where code is null order by created_at loop
    pfx := public.format_code(r.format);
    yr  := extract(year from r.created_at);
    insert into public.project_counters (prefix, year, seq)
      values (pfx, yr, 1)
      on conflict (prefix, year)
        do update set seq = public.project_counters.seq + 1
      returning seq into n;
    update public.projects
      set code = 'UBPC-' || pfx || '-' || yr::text || '-' || lpad(n::text, 4, '0')
      where id = r.id;
  end loop;
end $$;
