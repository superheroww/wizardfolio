-- Added anon_id support for anonymous mix event tracking.
alter table public.mix_events
  add column if not exists anon_id text;

create index if not exists mix_events_anon_id_idx
  on public.mix_events (anon_id);
