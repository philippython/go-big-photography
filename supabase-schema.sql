-- ============================================================
-- GoBig Photography Studio — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- Auto-update trigger function
-- ──────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────
-- 1. CATALOGUE ITEMS
-- ──────────────────────────────────────────
create table if not exists catalogue_items (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  category      text not null check (category in (
    'weddings','portraits','events','landscapes','commercial','street'
  )),
  description   text,
  image_url     text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists catalogue_items_updated_at on catalogue_items;
create trigger catalogue_items_updated_at
  before update on catalogue_items
  for each row execute procedure update_updated_at();

alter table catalogue_items enable row level security;

drop policy if exists "Public read catalogue"         on catalogue_items;
drop policy if exists "Auth insert catalogue"         on catalogue_items;
drop policy if exists "Auth update catalogue"         on catalogue_items;
drop policy if exists "Auth delete catalogue"         on catalogue_items;

create policy "Public read catalogue"
  on catalogue_items for select using (true);

create policy "Auth insert catalogue"
  on catalogue_items for insert to authenticated with check (true);

create policy "Auth update catalogue"
  on catalogue_items for update to authenticated using (true);

create policy "Auth delete catalogue"
  on catalogue_items for delete to authenticated using (true);

-- ──────────────────────────────────────────
-- 2. BOOKINGS
-- ──────────────────────────────────────────
create table if not exists bookings (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  email          text not null,
  phone          text,
  package_id     text,
  package_name   text,
  package_price  numeric,
  deposit_due    numeric,
  session_type   text,
  preferred_date date,
  location       text,
  outfit_notes   text,
  message        text,
  how_heard      text,
  status         text not null default 'new' check (status in (
    'new','contacted','confirmed','completed','declined'
  )),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at
  before update on bookings
  for each row execute procedure update_updated_at();

alter table bookings enable row level security;

drop policy if exists "Public insert bookings"  on bookings;
drop policy if exists "Auth read bookings"      on bookings;
drop policy if exists "Auth update bookings"    on bookings;

create policy "Public insert bookings"
  on bookings for insert with check (true);

create policy "Auth read bookings"
  on bookings for select to authenticated using (true);

create policy "Auth update bookings"
  on bookings for update to authenticated using (true);

-- ──────────────────────────────────────────
-- 3. STORAGE BUCKET
-- ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('catalogue-images', 'catalogue-images', true)
on conflict do nothing;

drop policy if exists "Public view catalogue images"        on storage.objects;
drop policy if exists "Auth upload catalogue images"        on storage.objects;
drop policy if exists "Auth delete catalogue images"        on storage.objects;

create policy "Public view catalogue images"
  on storage.objects for select
  using (bucket_id = 'catalogue-images');

create policy "Auth upload catalogue images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogue-images');

create policy "Auth delete catalogue images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'catalogue-images');

-- ──────────────────────────────────────────
-- 4. INDEXES
-- ──────────────────────────────────────────
create index if not exists idx_catalogue_category   on catalogue_items(category);
create index if not exists idx_catalogue_created_at on catalogue_items(created_at desc);
create index if not exists idx_bookings_created_at  on bookings(created_at desc);
create index if not exists idx_bookings_status      on bookings(status);
create index if not exists idx_bookings_email       on bookings(email);
