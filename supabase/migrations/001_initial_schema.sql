-- =====================================================================
-- ForgeFolio — Initial Schema
-- Run this once on a fresh Supabase project.
-- Extensions, tables, indexes, RLS policies, and functions.
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─── profiles ─────────────────────────────────────────────────────────
-- One row per auth.users user. Created on first profile save or onboarding.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text unique,                       -- forgefolio.com/u/:username
  full_name          text,
  college            text,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public read for /u/:username pages
create policy "Public can read profiles by username"
  on public.profiles for select
  using (username is not null);

-- ─── portfolios ───────────────────────────────────────────────────────
create table if not exists public.portfolios (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  slug              text unique not null,
  template          text not null default 'system-dark',
  field             text not null default 'cs',
  data              jsonb not null default '{}',
  raw_linkedin_text text,
  is_published      boolean not null default false,
  is_pro            boolean not null default false,
  score             integer,
  view_count        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists portfolios_user_id_idx  on public.portfolios(user_id);
create index if not exists portfolios_slug_idx     on public.portfolios(slug);
create index if not exists portfolios_published_idx on public.portfolios(is_published) where is_published = true;

alter table public.portfolios enable row level security;

create policy "Users can manage their own portfolios"
  on public.portfolios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can read published portfolios"
  on public.portfolios for select
  using (is_published = true);

-- ─── score_history ────────────────────────────────────────────────────
-- Append-only score snapshots for the timeline and Quarter Wrapped.
create table if not exists public.score_history (
  id           uuid primary key default uuid_generate_v4(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  score        integer not null,
  recorded_at  timestamptz not null default now()
);

create index if not exists score_history_portfolio_id_idx on public.score_history(portfolio_id, recorded_at desc);
create index if not exists score_history_user_id_idx      on public.score_history(user_id);

alter table public.score_history enable row level security;

create policy "Users can read their own score history"
  on public.score_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own score history"
  on public.score_history for insert
  with check (auth.uid() = user_id);

-- Service role handles inserts from API routes (score_history fire-and-forget)
-- No extra policy needed — service role bypasses RLS.

-- ─── analytics ────────────────────────────────────────────────────────
-- One row per portfolio page view. IPs are anonymized before insert.
create table if not exists public.analytics (
  id               uuid primary key default uuid_generate_v4(),
  portfolio_id     uuid not null references public.portfolios(id) on delete cascade,
  visitor_ip       text,                  -- anonymized /24 subnet only
  company          text,
  city             text,
  country          text,
  referrer         text,
  user_agent       text,
  duration_seconds integer,
  visited_at       timestamptz not null default now()
);

create index if not exists analytics_portfolio_id_idx on public.analytics(portfolio_id, visited_at desc);

alter table public.analytics enable row level security;

-- Portfolio owners can read their own analytics
create policy "Portfolio owners can read analytics"
  on public.analytics for select
  using (
    auth.uid() = (
      select user_id from public.portfolios where id = portfolio_id
    )
  );

-- track route uses service role — no insert policy needed for authenticated users
-- (service role bypasses RLS)

-- ─── applications ─────────────────────────────────────────────────────
create table if not exists public.applications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  company    text not null,
  role       text not null,
  status     text not null default 'wishlist',   -- wishlist|applied|screening|interview|offer|rejected|ghosted
  applied_at date,
  notes      text,
  url        text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications(user_id);

alter table public.applications enable row level security;

create policy "Users can manage their own applications"
  on public.applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── connections ──────────────────────────────────────────────────────
create table if not exists public.connections (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  role         text,
  company      text,
  relationship text,                        -- classmate|coworker|friend|alumni|other
  strength     text not null default 'medium', -- strong|medium|weak
  notes        text,
  linkedin_url text,
  created_at   timestamptz not null default now()
);

create index if not exists connections_user_id_idx on public.connections(user_id);

alter table public.connections enable row level security;

create policy "Users can manage their own connections"
  on public.connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── target_companies ─────────────────────────────────────────────────
create table if not exists public.target_companies (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  target_role  text,
  priority     text not null default 'medium',  -- high|medium|low
  status       text not null default 'researching',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists target_companies_user_id_idx on public.target_companies(user_id);

alter table public.target_companies enable row level security;

create policy "Users can manage their own target companies"
  on public.target_companies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── outreach_messages ────────────────────────────────────────────────
create table if not exists public.outreach_messages (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  connection_id  uuid references public.connections(id) on delete set null,
  target_id      uuid references public.target_companies(id) on delete set null,
  subject        text,
  body           text not null,
  tone           text,
  status         text not null default 'draft',  -- draft|sent
  created_at     timestamptz not null default now()
);

create index if not exists outreach_messages_user_id_idx on public.outreach_messages(user_id);

alter table public.outreach_messages enable row level security;

create policy "Users can manage their own outreach messages"
  on public.outreach_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Functions ────────────────────────────────────────────────────────

-- Called by /api/track to increment view_count atomically
create or replace function public.increment_view_count(p_portfolio_id uuid)
returns void
language sql security definer
as $$
  update public.portfolios
  set view_count = view_count + 1
  where id = p_portfolio_id;
$$;

-- Auto-update updated_at on portfolios, applications, target_companies
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger target_companies_updated_at
  before update on public.target_companies
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
