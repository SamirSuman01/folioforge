-- Score history table
-- Snapshot written on every portfolio save (via /api/portfolio/[id] PATCH)

create table if not exists score_history (
  id           uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  score        integer not null check (score between 0 and 100),
  recorded_at  timestamptz not null default now()
);

alter table score_history enable row level security;

create policy "Users view own score history"
  on score_history for select
  using (auth.uid() = user_id);

create policy "Users insert own score history"
  on score_history for insert
  with check (auth.uid() = user_id);

create index if not exists score_history_portfolio_id_idx on score_history(portfolio_id);
create index if not exists score_history_user_id_idx      on score_history(user_id);
create index if not exists score_history_recorded_at_idx  on score_history(recorded_at desc);
