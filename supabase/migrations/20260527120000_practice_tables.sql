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

alter table public.flashcards rename to practice_items;
alter table public.flashcard_reviews rename to practice_reviews;
alter table public.practice_reviews rename column flashcard_id to practice_item_id;

drop index if exists public.flashcards_user_due_idx;
drop index if exists public.flashcards_user_source_idx;
drop index if exists public.flashcards_updated_at_idx;
drop index if exists public.flashcard_reviews_user_reviewed_idx;
drop index if exists public.flashcard_reviews_flashcard_id_idx;
drop index if exists public.flashcard_reviews_source_idx;

alter table public.practice_items
  drop constraint if exists flashcards_user_id_fkey;

alter table public.practice_items
  add constraint practice_items_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.practice_reviews
  drop constraint if exists flashcard_reviews_flashcard_id_fkey;

alter table public.practice_reviews
  drop constraint if exists flashcard_reviews_user_id_fkey;

alter table public.practice_reviews
  add constraint practice_reviews_practice_item_id_fkey
  foreign key (practice_item_id) references public.practice_items (id) on delete cascade;

alter table public.practice_reviews
  add constraint practice_reviews_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

create index if not exists practice_items_user_due_idx
  on public.practice_items (user_id, due_at)
  where suspended_at is null;

create index if not exists practice_items_user_source_idx
  on public.practice_items (user_id, source_type, source_id);

create index if not exists practice_items_updated_at_idx
  on public.practice_items (updated_at desc);

create index if not exists practice_reviews_user_reviewed_idx
  on public.practice_reviews (user_id, reviewed_at desc);

create index if not exists practice_reviews_practice_item_id_idx
  on public.practice_reviews (practice_item_id);

create index if not exists practice_reviews_source_idx
  on public.practice_reviews (source_type, source_id);

alter table public.practice_items enable row level security;
alter table public.practice_reviews enable row level security;

drop policy if exists "Users can read their own flashcards" on public.practice_items;
drop policy if exists "Users can insert their own flashcards" on public.practice_items;
drop policy if exists "Users can update their own flashcards" on public.practice_items;
drop policy if exists "Users can delete their own flashcards" on public.practice_items;
drop policy if exists "Admins can read all flashcards" on public.practice_items;
drop policy if exists "Users can read their own flashcard reviews" on public.practice_reviews;
drop policy if exists "Users can insert their own flashcard reviews" on public.practice_reviews;
drop policy if exists "Admins can read all flashcard reviews" on public.practice_reviews;

create policy "Users can read their own practice items"
on public.practice_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own practice items"
on public.practice_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own practice items"
on public.practice_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own practice items"
on public.practice_items
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all practice items"
on public.practice_items
for select
to authenticated
using (public.is_admin());

create policy "Users can read their own practice reviews"
on public.practice_reviews
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own practice reviews"
on public.practice_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.practice_items as practice_items
    where practice_items.id = practice_item_id
      and practice_items.user_id = auth.uid()
  )
);

create policy "Admins can read all practice reviews"
on public.practice_reviews
for select
to authenticated
using (public.is_admin());

drop table if exists public.dictionary_flashcard_reviews;
drop table if exists public.dictionary_flashcards;
