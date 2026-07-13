-- ============================================================
--  FitAI — Supabase Database Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── user_profiles ────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with body measurements & preferences.
-- Created automatically when a user signs up (via trigger below).

create table if not exists public.user_profiles (
    id                  uuid references auth.users(id) on delete cascade primary key,
    created_at          timestamptz default now() not null,
    updated_at          timestamptz default now() not null,

    -- Identity
    display_name        text,
    avatar_url          text,

    -- Body measurements (all optional — filled progressively)
    height_cm           numeric(5,1),
    weight_kg           numeric(5,1),
    chest_cm            numeric(5,1),
    waist_cm            numeric(5,1),
    hips_cm             numeric(5,1),
    shoulder_width_cm   numeric(5,1),
    inseam_cm           numeric(5,1),

    -- Fit preferences
    usual_size          text check (usual_size in ('XS','S','M','L','XL','XXL','XXXL')),
    fit_preference      text check (fit_preference in ('slim','regular','relaxed','oversized')),
    gender_category     text check (gender_category in ('woman','man','custom'))
);

comment on table public.user_profiles is
    'One-to-one extension of auth.users storing body measurements and fit preferences.';

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.user_profiles (id, display_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
    before update on public.user_profiles
    for each row execute procedure public.set_updated_at();

-- ── products ──────────────────────────────────────────────────────────────────
-- Cached extracted product data. We scrape once and cache forever (until invalidated).

create table if not exists public.products (
    id              uuid default gen_random_uuid() primary key,
    created_at      timestamptz default now() not null,
    updated_at      timestamptz default now() not null,

    -- Source
    url             text unique not null,
    domain          text,

    -- Extracted data
    product_name    text,
    brand           text,
    category        text,   -- 'hoodie' | 'dress' | 'pants' | 'shirt' | etc.
    description     text,
    fabric          text,   -- 'cotton blend' | '100% polyester' | etc.
    fit_style       text,   -- 'slim' | 'regular' | 'oversized' | etc.

    -- Structured arrays
    available_sizes jsonb default '[]',   -- ["XS","S","M","L","XL"]
    available_colors jsonb default '[]',  -- [{"name":"Black","hex":"#2C2C2C"}]
    images          jsonb default '[]',   -- [{"url":"...","type":"front"}]

    -- Size chart: {"S":{"chest":96,"length":68},"M":{"chest":100,...}}
    size_chart      jsonb default '{}',

    -- Raw scraped HTML / full JSON for re-parsing
    raw_data        jsonb,

    scraped_at      timestamptz default now()
);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
    before update on public.products
    for each row execute procedure public.set_updated_at();

create index if not exists products_url_idx on public.products (url);
create index if not exists products_domain_idx on public.products (domain);

-- ── tryon_sessions ────────────────────────────────────────────────────────────
-- Represents a single try-on attempt — works for both anonymous and signed-in users.
-- Anonymous users get a session_token (stored in localStorage).
-- Signed-in users have user_id populated.

create table if not exists public.tryon_sessions (
    id              uuid default gen_random_uuid() primary key,
    created_at      timestamptz default now() not null,
    updated_at      timestamptz default now() not null,

    -- Auth: one of these will be set
    user_id         uuid references auth.users(id) on delete set null,
    session_token   text,   -- anonymous identifier (UUID generated client-side)

    -- Product being tried on
    product_id      uuid references public.products(id) on delete set null,

    -- Body inputs for THIS session
    -- If the user is logged in, these are pre-filled from their profile
    -- but can be overridden per-session
    height_cm           numeric(5,1),
    weight_kg           numeric(5,1),
    chest_cm            numeric(5,1),
    waist_cm            numeric(5,1),
    hips_cm             numeric(5,1),
    shoulder_width_cm   numeric(5,1),
    inseam_cm           numeric(5,1),
    gender_category     text,
    usual_size          text,
    fit_preference      text,

    -- Selections made during session
    selected_size   text,
    selected_color  text,

    -- Fit engine output
    recommended_size    text,
    fit_score           numeric(4,3),   -- 0.000 – 1.000
    fit_type            text,           -- 'tight'|'slim'|'regular'|'relaxed'|'oversized'
    fit_warnings        jsonb default '[]',  -- ["Sleeves slightly short"]
    fit_details         jsonb default '{}',  -- per-measurement breakdown

    -- Rendering output
    result_image_url    text,
    status              text default 'pending'
                        check (status in ('pending','extracting','fitting','rendering','done','error')),
    error_message       text
);

drop trigger if exists tryon_sessions_updated_at on public.tryon_sessions;
create trigger tryon_sessions_updated_at
    before update on public.tryon_sessions
    for each row execute procedure public.set_updated_at();

create index if not exists tryon_sessions_user_id_idx on public.tryon_sessions (user_id);
create index if not exists tryon_sessions_token_idx   on public.tryon_sessions (session_token);
create index if not exists tryon_sessions_product_idx on public.tryon_sessions (product_id);

-- ── saved_looks ───────────────────────────────────────────────────────────────
-- Authenticated users can bookmark any try-on result to their wardrobe.

create table if not exists public.saved_looks (
    id              uuid default gen_random_uuid() primary key,
    created_at      timestamptz default now() not null,

    user_id         uuid references auth.users(id) on delete cascade not null,
    session_id      uuid references public.tryon_sessions(id) on delete set null,
    product_id      uuid references public.products(id) on delete set null,

    selected_size   text,
    selected_color  text,
    result_image_url text,
    notes           text
);

create index if not exists saved_looks_user_idx on public.saved_looks (user_id);

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================

-- user_profiles: users can only read/update their own row
alter table public.user_profiles enable row level security;

create policy "Users can view their own profile"
    on public.user_profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.user_profiles for update
    using (auth.uid() = id);

-- products: readable by anyone (anon + authenticated), writable only by service role
alter table public.products enable row level security;

create policy "Products are publicly readable"
    on public.products for select
    using (true);

-- tryon_sessions:
--   anonymous: can read their own session by session_token (done server-side)
--   authenticated: can read/update their own sessions
alter table public.tryon_sessions enable row level security;

create policy "Users can view their own sessions"
    on public.tryon_sessions for select
    using (auth.uid() = user_id);

create policy "Users can update their own sessions"
    on public.tryon_sessions for update
    using (auth.uid() = user_id);

-- saved_looks: users manage their own saved looks
alter table public.saved_looks enable row level security;

create policy "Users can manage their saved looks"
    on public.saved_looks for all
    using (auth.uid() = user_id);

-- ============================================================
--  Useful views
-- ============================================================

-- Full session view with product and profile data joined
create or replace view public.session_details as
select
    s.id,
    s.created_at,
    s.status,
    s.user_id,
    s.session_token,
    -- product
    p.url             as product_url,
    p.product_name,
    p.brand,
    p.category,
    p.available_sizes,
    p.available_colors,
    p.size_chart,
    -- user measurements used
    s.height_cm,
    s.weight_kg,
    s.chest_cm,
    s.waist_cm,
    s.hips_cm,
    s.gender_category,
    s.usual_size,
    -- results
    s.recommended_size,
    s.fit_score,
    s.fit_type,
    s.fit_warnings,
    s.selected_size,
    s.selected_color,
    s.result_image_url
from public.tryon_sessions s
left join public.products p on p.id = s.product_id;
