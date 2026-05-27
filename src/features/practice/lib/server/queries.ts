import type { FlashcardCandidate } from "@/features/practice/lib/core";
import {
  createInitialFlashcardSchedulerState,
  reviewFlashcardSchedulerState,
} from "@/features/practice/lib/fsrsScheduler";
import type {
  FlashcardReviewRating,
  PracticeItemInsert,
  PracticeItemRow,
  PracticeItemUpdate,
  PracticeReviewInsert,
  PracticeReviewRow,
} from "@/features/practice/types";
import type { AppSupabaseClient, QueryResult } from "@/lib/supabase/queryTypes";
import type { DatabasePracticeDisplayDialect, Json } from "@/types/supabase";

type PracticeReviewResult = {
  dueAt: string;
  practiceItem: PracticeItemRow;
  review: PracticeReviewRow;
  reviewedAt: string;
};

type LatestPracticeReviewRow = Pick<
  PracticeReviewRow,
  "practice_item_id" | "rating" | "reviewed_at"
>;

function normalizeQueryError(error: { code?: string | null; message: string }) {
  return { code: error.code ?? null, message: error.message };
}

function asJson(value: Json) {
  return value;
}

function getCandidateKey(candidate: FlashcardCandidate) {
  return {
    locale: candidate.language,
    sourceId: candidate.sourceId,
    sourceType: candidate.sourceType,
    template: candidate.template,
    variantKey: candidate.variantKey,
  };
}

function getCandidateDisplayDialect(
  candidate: FlashcardCandidate,
): DatabasePracticeDisplayDialect {
  if (
    "displayDialect" in candidate &&
    typeof candidate.displayDialect === "string"
  ) {
    return candidate.displayDialect as DatabasePracticeDisplayDialect;
  }

  return null;
}

async function getExistingPracticeItem(
  supabase: AppSupabaseClient,
  userId: string,
  candidate: FlashcardCandidate,
): Promise<QueryResult<PracticeItemRow>> {
  const key = getCandidateKey(candidate);
  const { data, error } = await supabase
    .from("practice_items")
    .select("*")
    .eq("user_id", userId)
    .eq("source_type", key.sourceType)
    .eq("source_id", key.sourceId)
    .eq("template", key.template)
    .eq("locale", key.locale)
    .eq("variant_key", key.variantKey)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: normalizeQueryError(error),
    };
  }

  return {
    data: data ?? null,
    error: null,
  };
}

/**
 * Loads stored practice items for a set of dictionary entries, useful for joining
 * saved-entry rows with their learner-owned scheduling state.
 */
export async function getUserDictionaryPracticeItemsForEntries(
  supabase: AppSupabaseClient,
  userId: string,
  entryIds: readonly (number | string)[],
): Promise<QueryResult<PracticeItemRow[]>> {
  const normalizedEntryIds = Array.from(
    new Set(
      entryIds
        .map((entryId) => String(entryId).trim())
        .filter((entryId) => entryId.length > 0),
    ),
  );

  if (normalizedEntryIds.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("practice_items")
    .select("*")
    .eq("user_id", userId)
    .eq("source_type", "dictionary")
    .in("source_id", normalizedEntryIds)
    .order("due_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: normalizeQueryError(error),
    };
  }

  return {
    data: data ?? [],
    error: null,
  };
}

/**
 * Loads stored practice items for generated candidates across any source type.
 * The database query is grouped by source type and then narrowed in memory by
 * the full persisted identity so mixed decks can share one scheduler table.
 */
export async function getUserPracticeItemsForCandidates(
  supabase: AppSupabaseClient,
  userId: string,
  candidates: readonly FlashcardCandidate[],
): Promise<QueryResult<PracticeItemRow[]>> {
  const candidateKeys = new Map(
    candidates.map((candidate) => {
      const key = getCandidateKey(candidate);

      return [
        [
          key.sourceType,
          key.sourceId,
          key.template,
          key.locale,
          key.variantKey,
        ].join(":"),
        key,
      ];
    }),
  );

  if (candidateKeys.size === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const sourceIdsByType = new Map<
    FlashcardCandidate["sourceType"],
    Set<string>
  >();

  for (const key of candidateKeys.values()) {
    const sourceIds = sourceIdsByType.get(key.sourceType) ?? new Set<string>();

    sourceIds.add(key.sourceId);
    sourceIdsByType.set(key.sourceType, sourceIds);
  }

  const rows: PracticeItemRow[] = [];

  for (const [sourceType, sourceIds] of sourceIdsByType) {
    const { data, error } = await supabase
      .from("practice_items")
      .select("*")
      .eq("user_id", userId)
      .eq("source_type", sourceType)
      .in("source_id", Array.from(sourceIds))
      .order("due_at", { ascending: true });

    if (error) {
      return {
        data: null,
        error: normalizeQueryError(error),
      };
    }

    rows.push(...(data ?? []));
  }

  return {
    data: rows.filter((row) =>
      candidateKeys.has(
        [
          row.source_type,
          row.source_id,
          row.template,
          row.locale,
          row.variant_key,
        ].join(":"),
      ),
    ),
    error: null,
  };
}

export async function getUserPracticeItemById(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItemId: string,
): Promise<QueryResult<PracticeItemRow>> {
  const { data, error } = await supabase
    .from("practice_items")
    .select("*")
    .eq("id", practiceItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: normalizeQueryError(error),
    };
  }

  return {
    data: data ?? null,
    error: null,
  };
}

/**
 * Loads recent review events for materialized practice items so read models can
 * identify cards that currently need extra practice.
 */
export async function getLatestUserPracticeReviewsForItems(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItemIds: readonly string[],
): Promise<QueryResult<LatestPracticeReviewRow[]>> {
  const normalizedPracticeItemIds = Array.from(
    new Set(
      practiceItemIds
        .map((practiceItemId) => practiceItemId.trim())
        .filter((practiceItemId) => practiceItemId.length > 0),
    ),
  );

  if (normalizedPracticeItemIds.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("practice_reviews")
    .select("practice_item_id, rating, reviewed_at")
    .eq("user_id", userId)
    .in("practice_item_id", normalizedPracticeItemIds)
    .order("reviewed_at", { ascending: false })
    .limit(Math.max(100, normalizedPracticeItemIds.length * 4));

  if (error) {
    return {
      data: null,
      error: normalizeQueryError(error),
    };
  }

  return {
    data: data ?? [],
    error: null,
  };
}

/**
 * Creates the user's stored scheduler state for one derived practice item,
 * returning the existing row when the item was already materialized.
 */
export async function ensureUserPracticeItem(
  supabase: AppSupabaseClient,
  userId: string,
  candidate: FlashcardCandidate,
  now = new Date(),
): Promise<QueryResult<PracticeItemRow>> {
  const existingResult = await getExistingPracticeItem(
    supabase,
    userId,
    candidate,
  );

  if (existingResult.error || existingResult.data) {
    return existingResult;
  }

  const schedulerState = createInitialFlashcardSchedulerState(now);
  const key = getCandidateKey(candidate);
  const insertPayload = {
    display_dialect: getCandidateDisplayDialect(candidate),
    due_at: schedulerState.dueAt,
    locale: key.locale,
    scheduler_card: asJson(schedulerState.card),
    source_id: key.sourceId,
    source_type: key.sourceType,
    template: key.template,
    user_id: userId,
    variant_key: key.variantKey,
  } satisfies PracticeItemInsert;

  const { data, error } = await supabase
    .from("practice_items")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return getExistingPracticeItem(supabase, userId, candidate);
    }

    return {
      data: null,
      error: normalizeQueryError(error),
    };
  }

  return {
    data,
    error: null,
  };
}

/**
 * Applies one learner review to a stored practice item and appends the immutable
 * review event used for future analytics or scheduler replays.
 */
export async function recordUserPracticeReview(
  supabase: AppSupabaseClient,
  userId: string,
  practiceItem: PracticeItemRow,
  rating: FlashcardReviewRating,
  now = new Date(),
): Promise<QueryResult<PracticeReviewResult>> {
  if (practiceItem.user_id !== userId) {
    return {
      data: null,
      error: { message: "Practice item does not belong to the current user." },
    };
  }

  let schedulerResult: ReturnType<typeof reviewFlashcardSchedulerState>;
  try {
    schedulerResult = reviewFlashcardSchedulerState(
      practiceItem.scheduler_card,
      rating,
      now,
    );
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Invalid practice scheduler state.",
      },
    };
  }

  const updatePayload = {
    due_at: schedulerResult.dueAt,
    scheduler_card: asJson(schedulerResult.card),
    updated_at: schedulerResult.reviewedAt,
  } satisfies PracticeItemUpdate;

  const updateResult = await supabase
    .from("practice_items")
    .update(updatePayload)
    .eq("id", practiceItem.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateResult.error) {
    return {
      data: null,
      error: normalizeQueryError(updateResult.error),
    };
  }

  const reviewPayload = {
    locale: practiceItem.locale,
    practice_item_id: practiceItem.id,
    rating,
    reviewed_at: schedulerResult.reviewedAt,
    scheduler_card: asJson(schedulerResult.card),
    scheduler_log: asJson(schedulerResult.log),
    source_id: practiceItem.source_id,
    source_type: practiceItem.source_type,
    template: practiceItem.template,
    user_id: userId,
    variant_key: practiceItem.variant_key,
  } satisfies PracticeReviewInsert;

  const reviewResult = await supabase
    .from("practice_reviews")
    .insert(reviewPayload)
    .select("*")
    .single();

  if (reviewResult.error) {
    return {
      data: null,
      error: normalizeQueryError(reviewResult.error),
    };
  }

  return {
    data: {
      dueAt: schedulerResult.dueAt,
      practiceItem: updateResult.data,
      review: reviewResult.data,
      reviewedAt: schedulerResult.reviewedAt,
    },
    error: null,
  };
}
