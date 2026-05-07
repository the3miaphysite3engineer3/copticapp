alter table public.profiles
drop constraint if exists profiles_preferred_dictionary_dialect_check;

alter table public.profiles
add constraint profiles_preferred_dictionary_dialect_check
  check (preferred_dictionary_dialect in ('ALL', 'S', 'B', 'A', 'L', 'F', 'M'));
