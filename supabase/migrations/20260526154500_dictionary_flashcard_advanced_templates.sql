alter table public.dictionary_flashcards
  drop constraint if exists dictionary_flashcards_template_check;

alter table public.dictionary_flashcards
  add constraint dictionary_flashcards_template_check
  check (
    template in (
      'coptic_to_meaning',
      'meaning_to_coptic',
      'coptic_to_part_of_speech'
    )
  );

alter table public.dictionary_flashcard_reviews
  drop constraint if exists dictionary_flashcard_reviews_template_check;

alter table public.dictionary_flashcard_reviews
  add constraint dictionary_flashcard_reviews_template_check
  check (
    template in (
      'coptic_to_meaning',
      'meaning_to_coptic',
      'coptic_to_part_of_speech'
    )
  );
