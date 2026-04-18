-- Neon PostgreSQL schema for Travel Budget (subtractive budgeting)
-- Focused on core tables: trips, expenses
-- Includes extensibility for future multi-user collaboration

create extension if not exists pgcrypto;

-- ============================================================================
-- 1) trips: one trip record
-- ============================================================================
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,

  name text not null,
  description text,

  start_date date not null,
  end_date date not null,

  -- ISO 4217 currency code, e.g. CNY / USD
  base_currency char(3) not null,

  -- Budget snapshot (subtractive model)
  total_budget numeric(14,2) not null check (total_budget >= 0),
  remaining_budget numeric(14,2) not null check (remaining_budget >= 0),

  status text not null default 'active'
    check (status in ('planning', 'active', 'completed', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (start_date <= end_date),
  check (remaining_budget <= total_budget),
  check (base_currency = upper(base_currency))
);

create index if not exists idx_trips_owner_id on public.trips(owner_id);
create index if not exists idx_trips_status on public.trips(status);
create index if not exists idx_trips_dates on public.trips(start_date, end_date);


-- ============================================================================
-- 2) expenses: each spending record that deducts trip budget
-- ============================================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,

  -- Supports future collaborators
  created_by text not null,
  paid_by text,

  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null check (currency = upper(currency)),

  -- Rate from expense currency to trip base currency at spend time
  fx_rate_to_base numeric(18,8) not null check (fx_rate_to_base > 0),
  amount_in_base numeric(14,2) not null check (amount_in_base > 0),

  category text not null,
  spent_at timestamptz not null,
  note text,

  -- Prevent duplicate deduction on network retries
  idempotency_key text not null,

  is_voided boolean not null default false,
  voided_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (char_length(currency) = 3),
  check ((is_voided = false and voided_at is null) or (is_voided = true and voided_at is not null))
);

create unique index if not exists uq_expenses_trip_idempotency
  on public.expenses(trip_id, idempotency_key);

create index if not exists idx_expenses_trip_id on public.expenses(trip_id);
create index if not exists idx_expenses_created_by on public.expenses(created_by);
create index if not exists idx_expenses_spent_at on public.expenses(spent_at desc);
create index if not exists idx_expenses_trip_spent_at on public.expenses(trip_id, spent_at desc);
create index if not exists idx_expenses_category on public.expenses(category);


-- ============================================================================
-- 3) Extensibility: trip_members (future multi-user collaboration)
-- ============================================================================
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id text not null,

  role text not null default 'editor'
    check (role in ('owner', 'editor', 'viewer')),

  joined_at timestamptz not null default now(),

  unique (trip_id, user_id)
);

create index if not exists idx_trip_members_user_id on public.trip_members(user_id);
create index if not exists idx_trip_members_trip_id on public.trip_members(trip_id);


-- ============================================================================
-- 4) updated_at trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_trips_set_updated_at on public.trips;
create trigger trg_trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_set_updated_at on public.expenses;
create trigger trg_expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();


-- ============================================================================
-- 5) Optional row-level policies (enforced in API by Clerk userId)
-- ============================================================================
-- alter table public.trips enable row level security;
-- alter table public.expenses enable row level security;
-- alter table public.trip_members enable row level security;
