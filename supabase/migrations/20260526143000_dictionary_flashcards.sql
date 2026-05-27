create table if not exists public.dictionary_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id text not null,
  template text not null check (template in ('coptic_to_meaning')),
  locale text not null check (locale in ('en', 'nl')),
  selected_dialect text not null check (
    selected_dialect in ('ALL', 'S', 'B', 'A', 'L', 'F', 'M')
  ),
  display_dialect text check (
    display_dialect in ('A', 'B', 'F', 'Fb', 'L', 'M', 'Sl', 'O', 'S', 'Sa', 'Sf')
  ),
  scheduler_card jsonb not null,
  due_at timestamptz not null,
  suspended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, entry_id, template, locale, selected_dialect)
);

create table if not exists public.dictionary_flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.dictionary_flashcards (id) on delete cascade,
  entry_id text not null,
  template text not null check (template in ('coptic_to_meaning')),
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  reviewed_at timestamptz not null default timezone('utc', now()),
  scheduler_card jsonb not null,
  scheduler_log jsonb not null
);

create index if not exists dictionary_flashcards_user_due_idx
  on public.dictionary_flashcards (user_id, due_at)
  where suspended_at is null;

create index if not exists dictionary_flashcards_user_entry_idx
  on public.dictionary_flashcards (user_id, entry_id);

create index if not exists dictionary_flashcards_updated_at_idx
  on public.dictionary_flashcards (updated_at desc);

create index if not exists dictionary_flashcard_reviews_user_reviewed_idx
  on public.dictionary_flashcard_reviews (user_id, reviewed_at desc);

create index if not exists dictionary_flashcard_reviews_flashcard_id_idx
  on public.dictionary_flashcard_reviews (flashcard_id);

create index if not exists dictionary_flashcard_reviews_entry_id_idx
  on public.dictionary_flashcard_reviews (entry_id);

alter table public.dictionary_flashcards enable row level security;
alter table public.dictionary_flashcard_reviews enable row level security;

drop policy if exists "Users can read their own dictionary flashcards" on public.dictionary_flashcards;
drop policy if exists "Users can insert their own dictionary flashcards" on public.dictionary_flashcards;
drop policy if exists "Users can update their own dictionary flashcards" on public.dictionary_flashcards;
drop policy if exists "Users can delete their own dictionary flashcards" on public.dictionary_flashcards;
drop policy if exists "Admins can read all dictionary flashcards" on public.dictionary_flashcards;
drop policy if exists "Users can read their own dictionary flashcard reviews" on public.dictionary_flashcard_reviews;
drop policy if exists "Users can insert their own dictionary flashcard reviews" on public.dictionary_flashcard_reviews;
drop policy if exists "Admins can read all dictionary flashcard reviews" on public.dictionary_flashcard_reviews;

create policy "Users can read their own dictionary flashcards"
on public.dictionary_flashcards
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own dictionary flashcards"
on public.dictionary_flashcards
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own dictionary flashcards"
on public.dictionary_flashcards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own dictionary flashcards"
on public.dictionary_flashcards
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all dictionary flashcards"
on public.dictionary_flashcards
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own dictionary flashcard reviews"
on public.dictionary_flashcard_reviews
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own dictionary flashcard reviews"
on public.dictionary_flashcard_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.dictionary_flashcards as flashcards
    where flashcards.id = flashcard_id
      and flashcards.user_id = auth.uid()
  )
);

create policy "Admins can read all dictionary flashcard reviews"
on public.dictionary_flashcard_reviews
for select
to authenticated
using (public.is_admin());
