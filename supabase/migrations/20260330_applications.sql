-- Application Pipeline table
-- Tracks every job application a user is running

create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company     text not null,
  role        text not null,
  status      text not null default 'applied'
              check (status in ('wishlist','applied','screening','interview','offer','rejected','ghosted')),
  applied_at  date,
  notes       text,
  ghost_score integer check (ghost_score between 0 and 100),
  stale_flag  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: users only see their own rows
alter table applications enable row level security;

create policy "Users manage own applications"
  on applications for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-user queries
create index if not exists applications_user_id_idx on applications(user_id);

-- Auto-update updated_at on any row change
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_updated_at
  before update on applications
  for each row execute procedure touch_updated_at();
