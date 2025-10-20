-- Migration: proteger eliminacion de disponibilidad con citas activas y evitar solapes
-- Up migration

create or replace function public._citas_activas_count(p_disponibilidad_id bigint)
returns integer language sql stable as $$
  select count(*)::int
  from public.citas c
  where c.disponibilidad_id = p_disponibilidad_id
    and c.estado in ('programada','confirmada','pendiente');
$$;

create or replace function public.bloquear_delete_disponibilidad_con_citas()
returns trigger language plpgsql as $$
begin
  if public._citas_activas_count(old.id) > 0 then
    raise exception 'DISPONIBILIDAD_TIENE_CITAS_ACTIVAS'
      using hint = 'No puedes eliminar un bloque que tiene citas activas. Reprograma o cancela primero.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_disponibilidad_no_delete_con_citas on public.disponibilidad;
create trigger trg_disponibilidad_no_delete_con_citas
before delete on public.disponibilidad
for each row execute function public.bloquear_delete_disponibilidad_con_citas();

create index if not exists idx_citas_disponibilidad_estado
  on public.citas (disponibilidad_id, estado);

create extension if not exists btree_gist;

alter table public.disponibilidad
  add column if not exists rango tstzrange
  generated always as (tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)')) stored;

drop index if exists ux_disponibilidad_sin_solape;
create unique index ux_disponibilidad_sin_solape
  on public.disponibilidad using gist (doctor_id, rango)
  where estado in ('activo','pausado');
