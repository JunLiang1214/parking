-- Lot reservations for Trackr.
-- Safe to run more than once in the Supabase SQL editor.
--
-- The app reads/writes this table only through server-side API routes using
-- SUPABASE_SERVICE_ROLE_KEY. Do not grant anon/authenticated access unless a
-- future client-side feature intentionally needs direct table access.

create table if not exists public.lot_reservations (
  id uuid primary key default gen_random_uuid(),
  facility_code text not null,
  level text not null,
  lot text not null,
  reserved_by text not null,
  reserver_name text not null,
  reserver_phone text not null,
  reserver_unit text not null,
  reserved_until timestamptz not null,
  purpose text not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lot_reservations enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.lot_reservations to service_role;

create index if not exists lot_reservations_lookup_idx
on public.lot_reservations (facility_code, level, lot, reserved_until);

create index if not exists lot_reservations_active_idx
on public.lot_reservations (facility_code, reserved_until)
where cancelled_at is null;
