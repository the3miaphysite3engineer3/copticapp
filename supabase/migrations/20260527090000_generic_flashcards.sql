create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null check (source_type in ('dictionary', 'grammar')),
  source_id text not null,
  template text not null check (char_length(template) between 1 and 120),
  locale text not null check (locale in ('en', 'nl')),
  variant_key text not null check (char_length(variant_key) between 1 and 160),
  display_dialect text check (
    display_dialect in ('A', 'B', 'F', 'Fb', 'L', 'M', 'Sl', 'O', 'S', 'Sa', 'Sf')
  ),
  scheduler_card jsonb not null,
  due_at timestamptz not null,
  suspended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source_type, source_id, template, locale, variant_key)
);

create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  source_type text not null check (source_type in ('dictionary', 'grammar')),
  source_id text not null,
  template text not null check (char_length(template) between 1 and 120),
  locale text not null check (locale in ('en', 'nl')),
  variant_key text not null check (char_length(variant_key) between 1 and 160),
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  reviewed_at timestamptz not null default timezone('utc', now()),
  scheduler_card jsonb not null,
  scheduler_log jsonb not null
);

insert into public.flashcards (
  id,
  user_id,
  source_type,
  source_id,
  template,
  locale,
  variant_key,
  display_dialect,
  scheduler_card,
  due_at,
  suspended_at,
  created_at,
  updated_at
)
select
  id,
  user_id,
  'dictionary',
  entry_id,
  template,
  locale,
  selected_dialect,
  display_dialect,
  scheduler_card,
  due_at,
  suspended_at,
  created_at,
  updated_at
from public.dictionary_flashcards
on conflict (user_id, source_type, source_id, template, locale, variant_key)
do update set
  display_dialect = excluded.display_dialect,
  scheduler_card = excluded.scheduler_card,
  due_at = excluded.due_at,
  suspended_at = excluded.suspended_at,
  updated_at = excluded.updated_at;

insert into public.flashcard_reviews (
  id,
  user_id,
  flashcard_id,
  source_type,
  source_id,
  template,
  locale,
  variant_key,
  rating,
  reviewed_at,
  scheduler_card,
  scheduler_log
)
select
  reviews.id,
  reviews.user_id,
  generic_flashcards.id,
  'dictionary',
  reviews.entry_id,
  reviews.template,
  dictionary_flashcards.locale,
  dictionary_flashcards.selected_dialect,
  reviews.rating,
  reviews.reviewed_at,
  reviews.scheduler_card,
  reviews.scheduler_log
from public.dictionary_flashcard_reviews as reviews
join public.dictionary_flashcards as dictionary_flashcards
  on dictionary_flashcards.id = reviews.flashcard_id
join public.flashcards as generic_flashcards
  on generic_flashcards.user_id = dictionary_flashcards.user_id
  and generic_flashcards.source_type = 'dictionary'
  and generic_flashcards.source_id = dictionary_flashcards.entry_id
  and generic_flashcards.template = dictionary_flashcards.template
  and generic_flashcards.locale = dictionary_flashcards.locale
  and generic_flashcards.variant_key = dictionary_flashcards.selected_dialect
on conflict (id) do nothing;

create index if not exists flashcards_user_due_idx
  on public.flashcards (user_id, due_at)
  where suspended_at is null;

create index if not exists flashcards_user_source_idx
  on public.flashcards (user_id, source_type, source_id);

create index if not exists flashcards_updated_at_idx
  on public.flashcards (updated_at desc);

create index if not exists flashcard_reviews_user_reviewed_idx
  on public.flashcard_reviews (user_id, reviewed_at desc);

create index if not exists flashcard_reviews_flashcard_id_idx
  on public.flashcard_reviews (flashcard_id);

create index if not exists flashcard_reviews_source_idx
  on public.flashcard_reviews (source_type, source_id);

alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;

drop policy if exists "Users can read their own flashcards" on public.flashcards;
drop policy if exists "Users can insert their own flashcards" on public.flashcards;
drop policy if exists "Users can update their own flashcards" on public.flashcards;
drop policy if exists "Users can delete their own flashcards" on public.flashcards;
drop policy if exists "Admins can read all flashcards" on public.flashcards;
drop policy if exists "Users can read their own flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Users can insert their own flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Admins can read all flashcard reviews" on public.flashcard_reviews;

create policy "Users can read their own flashcards"
on public.flashcards
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
on public.flashcards
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
on public.flashcards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
on public.flashcards
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all flashcards"
on public.flashcards
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own flashcard reviews"
on public.flashcard_reviews
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own flashcard reviews"
on public.flashcard_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.flashcards as flashcards
    where flashcards.id = flashcard_id
      and flashcards.user_id = auth.uid()
  )
);

create policy "Admins can read all flashcard reviews"
on public.flashcard_reviews
for select
to authenticated
using (public.is_admin());
