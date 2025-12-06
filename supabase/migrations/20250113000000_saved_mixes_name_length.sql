-- Added by Codex: enforce a maximum length on saved mix names.
alter table public.saved_mixes
  add constraint saved_mixes_name_length_check
  check (char_length(name) <= 60);
