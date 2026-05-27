import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export const FLASHCARD_REVIEW_RATINGS = [
  "again",
  "hard",
  "good",
  "easy",
] as const;

export type FlashcardReviewRating = (typeof FLASHCARD_REVIEW_RATINGS)[number];

export type PracticeItemRow = Tables<"practice_items">;
export type PracticeItemInsert = TablesInsert<"practice_items">;
export type PracticeItemUpdate = TablesUpdate<"practice_items">;

export type PracticeReviewRow = Tables<"practice_reviews">;
export type PracticeReviewInsert = TablesInsert<"practice_reviews">;

export type FlashcardRow = PracticeItemRow;
export type FlashcardReviewRow = PracticeReviewRow;

export type DictionaryFlashcardRow = FlashcardRow;
