-- ─────────────────────────────────────────────────────────────
-- Review Reply Assistant v2 — initial schema
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`).
--
-- Auth users live in Supabase's built-in `auth.users`. Every table below
-- is scoped to a user via `user_id` and protected by Row Level Security so
-- one user can never read another user's connections, locations, or reviews.
-- ─────────────────────────────────────────────────────────────

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── Google OAuth connections (Phase 3) ───────────────────────
-- Tokens are stored ENCRYPTED at the application layer before insert.
create table if not exists public.google_connections (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  google_email             text,
  access_token_encrypted   text,
  refresh_token_encrypted  text,
  token_expiry             timestamptz,
  scope                    text,
  last_error               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);

-- ── Short-lived OAuth state (CSRF protection, Phase 3) ────────
create table if not exists public.oauth_states (
  state       text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ── Selected business location (Phase 5) ─────────────────────
create table if not exists public.business_locations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  google_account_id text not null,
  location_id       text not null,       -- Google location resource name/id
  display_name      text,
  address           text,
  is_selected       boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (user_id, location_id)
);

-- ── Synced reviews (Phase 6) ─────────────────────────────────
create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  location_id        text not null,
  google_review_id   text not null,      -- dedupe key
  reviewer_name      text,
  rating             int,                -- 1..5
  review_text        text,
  review_created_at  timestamptz,
  existing_reply     text,               -- reply already on Google, if any
  reply_status       text not null default 'none', -- none | drafted | posted
  draft_reply        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, google_review_id)
);

-- ── Activity log (Phase 8) ───────────────────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null,
  detail      text,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────
alter table public.google_connections  enable row level security;
alter table public.oauth_states         enable row level security;
alter table public.business_locations   enable row level security;
alter table public.reviews              enable row level security;
alter table public.activity_log         enable row level security;

-- Each user may only touch their own rows. Server routes that need to bypass
-- RLS (e.g. token storage with the service role key) do so explicitly.
do $$
declare
  t text;
begin
  foreach t in array array[
    'google_connections',
    'oauth_states',
    'business_locations',
    'reviews',
    'activity_log'
  ]
  loop
    execute format(
      'drop policy if exists %1$s_owner on public.%1$s;', t
    );
    execute format(
      'create policy %1$s_owner on public.%1$s
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t
    );
  end loop;
end $$;

-- ── updated_at trigger ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_google_connections_updated on public.google_connections;
create trigger trg_google_connections_updated
  before update on public.google_connections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reviews_updated on public.reviews;
create trigger trg_reviews_updated
  before update on public.reviews
  for each row execute function public.set_updated_at();
