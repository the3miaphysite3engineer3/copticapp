import type { FlashcardCandidate } from "@/features/practice/lib/core";
import {
  ensureUserPracticeItem as ensureUserPracticeItemQuery,
  getLatestUserPracticeReviewsForItems as getLatestUserPracticeReviewsForItemsQuery,
  getUserDictionaryPracticeItemsForEntries as getUserDictionaryPracticeItemsForEntriesQuery,
  getUserPracticeItemById as getUserPracticeItemByIdQuery,
  getUserPracticeItemsForCandidates as getUserPracticeItemsForCandidatesQuery,
  recordUserPracticeReview as recordUserPracticeReviewQuery,
} from "@/features/practice/lib/server/queries";
import type {
  FlashcardReviewRow,
  FlashcardReviewRating,
  FlashcardRow,
} from "@/features/practice/types";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";

type PracticePersistenceCandidate = FlashcardCandidate;
type PracticePersistenceRow = FlashcardRow;
type PracticeReviewPersistenceRow = FlashcardReviewRow;

export type { FlashcardRow };

export async function loadUserPracticeItemsForDictionaryEntries(
  supabase: AppSupabaseClient,
  userId: string,
  entryIds: readonly (number | string)[],
) {
  return getUserDictionaryPracticeItemsForEntriesQuery(
    supabase,
    userId,
    entryIds,
  );
}

export async function loadUserPracticeItemsForCandidates(
  supabase: AppSupabaseClient,
  userId: string,
  candidates: readonly PracticePersistenceCandidate[],
) {
  return getUserPracticeItemsForCandidatesQuery(supabase, userId, candidates);
}

export async function loadLatestUserPracticeReviews(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItemIds: readonly string[],
) {
  return getLatestUserPracticeReviewsForItemsQuery(
    supabase,
    userId,
    practiceItemIds,
  );
}

export async function ensureUserPracticeItem(
  supabase: AppSupabaseClient,
  userId: string,
  candidate: PracticePersistenceCandidate,
) {
  return ensureUserPracticeItemQuery(supabase, userId, candidate);
}

export async function getUserPracticeItemById(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItemId: string,
) {
  return getUserPracticeItemByIdQuery(supabase, userId, practiceItemId);
}

export async function recordUserPracticeReview(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItem: PracticePersistenceRow,
  rating: FlashcardReviewRating,
): Promise<
  QueryResult<{
    dueAt: string;
    practiceItem: PracticePersistenceRow;
    review: PracticeReviewPersistenceRow;
    reviewedAt: string;
  }>
> {
  return recordUserPracticeReviewQuery(supabase, userId, practiceItem, rating);
}
