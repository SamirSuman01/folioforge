-- FolioForge Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Portfolios table
create table portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  template text default 'system-dark' not null,
  data jsonb not null default '{}',
  raw_linkedin_text text default '',
  field text default 'cs',
  is_published boolean default false,
  is_pro boolean default false,
  view_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Analytics table
create table analytics (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references portfolios(id) on delete cascade not null,
  visitor_ip text,
  company text default '',
  city text default 'Unknown',
  country text default 'Unknown',
  referrer text default 'direct',
  user_agent text default '',
  duration_seconds integer,
  visited_at timestamptz default now() not null
);

-- Indexes
create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_slug on portfolios(slug);
create index idx_analytics_portfolio_id on analytics(portfolio_id);
create index idx_analytics_visited_at on analytics(visited_at);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on portfolios
  for each row
  execute function update_updated_at();

-- Increment view count function (called from /api/track)
create or replace function increment_view_count(p_portfolio_id uuid)
returns void as $$
begin
  update portfolios
  set view_count = view_count + 1
  where id = p_portfolio_id;
end;
$$ language plpgsql security definer;

-- Row Level Security
alter table portfolios enable row level security;
alter table analytics enable row level security;

-- Portfolios: users can CRUD their own
create policy "Users can view own portfolios"
  on portfolios for select
  using (auth.uid() = user_id);

create policy "Users can create own portfolios"
  on portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update own portfolios"
  on portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete own portfolios"
  on portfolios for delete
  using (auth.uid() = user_id);

-- Portfolios: anyone can view published portfolios (for /p/[slug])
create policy "Anyone can view published portfolios"
  on portfolios for select
  using (is_published = true);

-- Analytics: only portfolio owner can read
create policy "Portfolio owners can view analytics"
  on analytics for select
  using (
    portfolio_id in (
      select id from portfolios where user_id = auth.uid()
    )
  );

-- Analytics: inserts done via service role key (no RLS needed for insert)
-- The /api/track route uses the service role key to bypass RLS
