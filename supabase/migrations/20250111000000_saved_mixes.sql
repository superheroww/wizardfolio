-- Created by Codex: add saved_mixes table with RLS.
create extension if not exists "pgcrypto";

create table if not exists public.saved_mixes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  positions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_mixes enable row level security;

create policy if not exists "saved_mixes_owner_select"
  on public.saved_mixes for select using (auth.uid() = user_id);

create policy if not exists "saved_mixes_owner_insert"
  on public.saved_mixes for insert with check (auth.uid() = user_id);

create policy if not exists "saved_mixes_owner_update"
  on public.saved_mixes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "saved_mixes_owner_delete"
  on public.saved_mixes for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
  returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists set_updated_at_saved_mixes
  before update on public.saved_mixes
  for each row execute function public.set_updated_at();
