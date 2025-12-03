-- Created by Codex: add mix_events logging table.
create extension if not exists "pgcrypto";

create table if not exists public.mix_events (
  id uuid primary key default gen_random_uuid(),
  positions jsonb not null,
  benchmark_symbol text,
  source text,
  template_key text,
  referrer text,
  created_at timestamptz not null default now()
);
