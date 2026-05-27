"use server";

import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  isDialectFilter,
} from "@/features/dictionary/config";
import { getDictionaryEntryById } from "@/features/dictionary/lib/dictionary";
import type { FlashcardCandidate } from "@/features/practice/lib/core";
import {
  DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING,
  buildDictionaryFlashcardCandidate,
  isDictionaryFlashcardTemplate,
} from "@/features/practice/lib/dictionaryFlashcards";
import { isFlashcardReviewRating } from "@/features/practice/lib/fsrsScheduler";
import {
  buildGrammarFlashcardCandidateByIdentity,
  isGrammarFlashcardTemplate,
} from "@/features/practice/lib/grammarFlashcards";
import {
  ensureUserPracticeItem,
  getUserPracticeItemById,
  recordUserPracticeReview,
} from "@/features/practice/lib/server/persistence";
import type { FlashcardReviewRating } from "@/features/practice/types";
import type { Language } from "@/lib/i18n";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import {
  getFormLanguage,
  getFormString,
  isUuid,
  normalizeWhitespace,
} from "@/lib/validation";

export type PracticeActionState = {
  dueAt?: string;
  error?: string;
  practiceItemId?: string;
  message?: string;
  reviewedAt?: string;
  reviewId?: string;
  success: boolean;
} | null;

const PRACTICE_ACTION_COPY: Record<
  Language,
  {
    authRequired: string;
    ensureFailed: string;
    invalidEntry: string;
    invalidReview: string;
    notFound: string;
    reviewFailed: string;
    reviewSaved: string;
    storageUnavailable: string;
  }
> = {
  en: {
    authRequired: "Please sign in before saving practice progress.",
    ensureFailed: "Could not prepare this practice item right now.",
    invalidEntry: "This material cannot be turned into practice.",
    invalidReview: "Please submit a valid practice review.",
    notFound: "This practice item could not be found.",
    reviewFailed: "Could not save this practice review right now.",
    reviewSaved: "Practice review saved.",
    storageUnavailable: "Practice is not configured yet.",
  },
  nl: {
    authRequired: "Meld u eerst aan voordat u oefenvoortgang opslaat.",
    ensureFailed: "Dit oefenitem kon nu niet worden voorbereid.",
    invalidEntry: "Van dit materiaal kan geen oefening worden gemaakt.",
    invalidReview: "Dien een geldige oefenbeoordeling in.",
    notFound: "Dit oefenitem kon niet worden gevonden.",
    reviewFailed: "Deze oefenbeoordeling kon nu niet worden opgeslagen.",
    reviewSaved: "Oefenbeoordeling opgeslagen.",
    storageUnavailable: "Oefenen is nog niet geconfigureerd.",
  },
};

function getSubmittedLanguage(formData: FormData) {
  return getFormLanguage(
    formData,
    getFormString(formData, "language") ? "language" : "locale",
  );
}

function getPracticeStorageUnavailableState(language: Language) {
  return {
    success: false,
    error: PRACTICE_ACTION_COPY[language].storageUnavailable,
  } satisfies NonNullable<PracticeActionState>;
}

function getPracticeAuthRequiredState(language: Language) {
  return {
    success: false,
    error: PRACTICE_ACTION_COPY[language].authRequired,
  } satisfies NonNullable<PracticeActionState>;
}

function getPracticeActionFailureState(options: {
  action: "ensure" | "review";
  error: { code?: string | null; message: string } | null;
  language: Language;
  metadata: Record<string, string>;
}) {
  const copy = PRACTICE_ACTION_COPY[options.language];
  console.error("Practice action failed", {
    action: options.action,
    error: options.error?.message ?? "Unknown error",
    ...options.metadata,
  });

  let errorMessage =
    options.action === "ensure" ? copy.ensureFailed : copy.reviewFailed;
  if (isMissingSupabaseTableError(options.error)) {
    errorMessage = copy.storageUnavailable;
  }

  return {
    success: false,
    error: errorMessage,
  } satisfies NonNullable<PracticeActionState>;
}

type ParsedPracticeEnsureSubmission = {
  candidate: FlashcardCandidate;
  language: Language;
  sourceId: string;
  sourceType: string;
};

function parsePracticeEnsureSubmission(
  formData: FormData,
): { error: PracticeActionState } | { values: ParsedPracticeEnsureSubmission } {
  const language = getSubmittedLanguage(formData);
  const sourceType =
    normalizeWhitespace(getFormString(formData, "sourceType")) || "dictionary";
  const sourceId =
    normalizeWhitespace(getFormString(formData, "sourceId")) ||
    normalizeWhitespace(getFormString(formData, "entryId"));
  const variantKey = normalizeWhitespace(getFormString(formData, "variantKey"));
  const rawSelectedDialect = normalizeWhitespace(
    getFormString(formData, "selectedDialect"),
  );
  const selectedDialect = isDialectFilter(rawSelectedDialect)
    ? rawSelectedDialect
    : DEFAULT_DICTIONARY_DIALECT_FILTER;
  const rawTemplate = normalizeWhitespace(getFormString(formData, "template"));
  let candidate: FlashcardCandidate | null = null;

  if (sourceType === "grammar") {
    candidate =
      sourceId && isGrammarFlashcardTemplate(rawTemplate)
        ? buildGrammarFlashcardCandidateByIdentity({
            language,
            sourceId,
            template: rawTemplate,
            variantKey,
          })
        : null;
  } else {
    const template = isDictionaryFlashcardTemplate(rawTemplate)
      ? rawTemplate
      : DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING;
    const entry = getDictionaryEntryById(sourceId);

    candidate = entry
      ? buildDictionaryFlashcardCandidate({
          entry,
          language,
          selectedDialect,
          template,
        })
      : null;
  }

  if (!candidate) {
    return {
      error: {
        success: false,
        error: PRACTICE_ACTION_COPY[language].invalidEntry,
      },
    };
  }

  return {
    values: {
      candidate,
      language,
      sourceId,
      sourceType,
    },
  };
}

type ParsedPracticeReviewSubmission = {
  practiceItemId: string;
  language: Language;
  rating: FlashcardReviewRating;
};

function parsePracticeReviewSubmission(
  formData: FormData,
): { error: PracticeActionState } | { values: ParsedPracticeReviewSubmission } {
  const language = getSubmittedLanguage(formData);
  const practiceItemId = normalizeWhitespace(
    getFormString(formData, "practiceItemId"),
  );
  const rating = normalizeWhitespace(getFormString(formData, "rating"));

  if (!isUuid(practiceItemId) || !isFlashcardReviewRating(rating)) {
    return {
      error: {
        success: false,
        error: PRACTICE_ACTION_COPY[language].invalidReview,
      },
    };
  }

  return {
    values: {
      practiceItemId,
      language,
      rating,
    },
  };
}

/**
 * Materializes an authenticated user's scheduler row for one source-derived
 * practice item. Existing rows are returned without resetting progress.
 */
export async function ensurePracticeItemForSource(
  _prevState: PracticeActionState,
  formData: FormData,
): Promise<PracticeActionState> {
  const parseResult = parsePracticeEnsureSubmission(formData);
  if ("error" in parseResult) {
    return parseResult.error;
  }

  const { candidate, language, sourceId, sourceType } = parseResult.values;

  if (!hasSupabaseRuntimeEnv()) {
    return getPracticeStorageUnavailableState(language);
  }

  const authContext = await getAuthenticatedServerContext();
  if (!authContext) {
    return getPracticeAuthRequiredState(language);
  }

  const result = await ensureUserPracticeItem(
    authContext.supabase,
    authContext.user.id,
    candidate,
  );

  if (result.error || !result.data) {
    return getPracticeActionFailureState({
      action: "ensure",
      error: result.error,
      language,
      metadata: {
        sourceId,
        sourceType,
        userId: authContext.user.id,
      },
    });
  }

  return {
    dueAt: result.data.due_at,
    practiceItemId: result.data.id,
    success: true,
  };
}

/**
 * Records one authenticated practice review and advances the stored FSRS
 * scheduler state.
 */
export async function submitPracticeReview(
  _prevState: PracticeActionState,
  formData: FormData,
): Promise<PracticeActionState> {
  const parseResult = parsePracticeReviewSubmission(formData);
  if ("error" in parseResult) {
    return parseResult.error;
  }

  const { practiceItemId, language, rating } = parseResult.values;

  if (!hasSupabaseRuntimeEnv()) {
    return getPracticeStorageUnavailableState(language);
  }

  const authContext = await getAuthenticatedServerContext();
  if (!authContext) {
    return getPracticeAuthRequiredState(language);
  }

  const practiceItemResult = await getUserPracticeItemById(
    authContext.supabase,
    authContext.user.id,
    practiceItemId,
  );

  if (practiceItemResult.error) {
    return getPracticeActionFailureState({
      action: "review",
      error: practiceItemResult.error,
      language,
      metadata: {
        practiceItemId,
        userId: authContext.user.id,
      },
    });
  }

  if (!practiceItemResult.data) {
    return {
      success: false,
      error: PRACTICE_ACTION_COPY[language].notFound,
    };
  }

  const reviewResult = await recordUserPracticeReview(
    authContext.supabase,
    authContext.user.id,
    practiceItemResult.data,
    rating,
  );

  if (reviewResult.error || !reviewResult.data) {
    return getPracticeActionFailureState({
      action: "review",
      error: reviewResult.error,
      language,
      metadata: {
        practiceItemId,
        userId: authContext.user.id,
      },
    });
  }

  return {
    dueAt: reviewResult.data.dueAt,
    practiceItemId: reviewResult.data.practiceItem.id,
    message: PRACTICE_ACTION_COPY[language].reviewSaved,
    reviewedAt: reviewResult.data.reviewedAt,
    reviewId: reviewResult.data.review.id,
    success: true,
  };
}
