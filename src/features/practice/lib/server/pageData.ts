import {
  getDictionaryEntryById,
  listDictionaryEntries,
} from "@/features/dictionary/lib/dictionary";
import type { EntryFavoriteWithEntry } from "@/features/dictionary/lib/entryActions";
import { getUserEntryFavorites } from "@/features/dictionary/lib/server/queries";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import type {
  FlashcardDeckReadModel,
  FlashcardReviewSnapshot,
} from "@/features/practice/lib/core";
import {
  type AppFlashcardCandidate,
  type AppFlashcardCandidateSource,
  type AppFlashcardDeckId,
  type AppFlashcardDeckOption,
  type AppFlashcardDeckSummary,
  buildFlashcardDeckOptions,
  buildGeneratedFlashcardSourcesByDeckId,
  getFlashcardDeckDefinition,
  isPrivateFlashcardDeckId,
} from "@/features/practice/lib/deckRegistry";
import {
  buildDictionaryFlashcardsDeckReadModel,
  DEFAULT_DICTIONARY_FLASHCARD_DECK_ID,
  PUBLIC_DICTIONARY_FLASHCARD_DECK_ID,
} from "@/features/practice/lib/dictionaryDecks";
import {
  buildSavedEntriesPracticeReadModel,
  type SavedEntriesPracticeReadModel,
} from "@/features/practice/lib/savedEntriesDeck";
import {
  type FlashcardRow,
  loadLatestUserPracticeReviews,
  loadUserPracticeItemsForCandidates,
  loadUserPracticeItemsForDictionaryEntries,
} from "@/features/practice/lib/server/persistence";
import { getProfile } from "@/features/profile/lib/server/queries";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type { Language } from "@/types/i18n";
import type { Tables } from "@/types/supabase";

import type { User } from "@supabase/supabase-js";

type PracticeStorageError = {
  code?: string | null;
  message: string;
};

type PracticePageData = {
  activeDeck: AppFlashcardDeckSummary;
  activeDeckId: AppFlashcardDeckId;
  deck: FlashcardDeckReadModel<AppFlashcardCandidate>;
  deckOptions: AppFlashcardDeckOption[];
  isAuthenticated: boolean;
  storageError: PracticeStorageError | null;
};

export function buildSavedDictionaryEntries(
  entryFavorites: Awaited<ReturnType<typeof getUserEntryFavorites>>,
): EntryFavoriteWithEntry[] {
  return entryFavorites.map((favorite) => ({
    entry: getDictionaryEntryById(favorite.entry_id),
    favorite,
  }));
}

function withStorageBlockedDeck<
  TCandidate extends AppFlashcardCandidate,
  TDeck extends FlashcardDeckReadModel<TCandidate>,
>(deck: TDeck): TDeck {
  return {
    ...deck,
    queue: [],
    stats: {
      ...deck.stats,
      queuedCards: 0,
    },
  };
}

function getDeckSourceCount({
  deckId,
  generatedSourcesByDeckId,
  savedDeck,
}: {
  deckId: string;
  generatedSourcesByDeckId: ReadonlyMap<string, AppFlashcardCandidateSource[]>;
  savedDeck: SavedEntriesPracticeReadModel;
}) {
  if (deckId === DEFAULT_DICTIONARY_FLASHCARD_DECK_ID) {
    return savedDeck.stats.availableCards;
  }

  return generatedSourcesByDeckId.get(deckId)?.length ?? 0;
}

function buildAppFlashcardDeckOptions({
  generatedSourcesByDeckId,
  savedDeck,
}: {
  generatedSourcesByDeckId: ReadonlyMap<string, AppFlashcardCandidateSource[]>;
  savedDeck: SavedEntriesPracticeReadModel;
}): AppFlashcardDeckOption[] {
  return buildFlashcardDeckOptions({
    getSourceCount: (deckId) =>
      getDeckSourceCount({
        deckId,
        generatedSourcesByDeckId,
        savedDeck,
      }),
  });
}

function buildGeneratedSourcesByDeckId(options: {
  dictionary: ReturnType<typeof listDictionaryEntries>;
  grammarLessons: NonNullable<
    ReturnType<typeof getPublishedGrammarLessonBundleBySlug>
  >[];
  locale: Language;
}) {
  return buildGeneratedFlashcardSourcesByDeckId({
    context: {
      dictionary: {
        entries: options.dictionary,
      },
      grammar: {
        lessons: options.grammarLessons,
      },
    },
    language: options.locale,
  });
}

async function loadLatestReviewsByPracticeItemId(options: {
  practiceItems: readonly FlashcardRow[];
  supabase: AppSupabaseClient;
  userId: string;
}) {
  const reviewsResult = await loadLatestUserPracticeReviews(
    options.supabase,
    options.userId,
    options.practiceItems.map((practiceItem) => practiceItem.id),
  );
  const latestReviewsByPracticeItemId = new Map<
    string,
    FlashcardReviewSnapshot
  >();

  if (reviewsResult.error) {
    return latestReviewsByPracticeItemId;
  }

  for (const review of reviewsResult.data ?? []) {
    const existingSnapshot = latestReviewsByPracticeItemId.get(
      review.practice_item_id,
    );

    if (existingSnapshot) {
      if (existingSnapshot.recentRatings.length < 4) {
        existingSnapshot.recentRatings.push(review.rating);
      }

      continue;
    }

    latestReviewsByPracticeItemId.set(review.practice_item_id, {
      flashcardId: review.practice_item_id,
      rating: review.rating,
      recentRatings: [review.rating],
      reviewedAt: review.reviewed_at,
    });
  }

  return latestReviewsByPracticeItemId;
}

export async function loadSavedEntriesPracticeDeck(options: {
  locale: Language;
  now?: Date;
  savedDictionaryEntries: readonly EntryFavoriteWithEntry[];
  supabase: AppSupabaseClient;
  userId: string;
  preferredDialect: Tables<"profiles">["preferred_dictionary_dialect"];
}) {
  const practiceItemsResult = await loadUserPracticeItemsForDictionaryEntries(
    options.supabase,
    options.userId,
    options.savedDictionaryEntries.map(({ favorite }) => favorite.entry_id),
  );
  const storageError = practiceItemsResult.error ?? null;
  const existingPracticeItems = storageError
    ? []
    : (practiceItemsResult.data ?? []);
  const latestReviewsByPracticeItemId = storageError
    ? new Map<string, FlashcardReviewSnapshot>()
    : await loadLatestReviewsByPracticeItemId({
        practiceItems: existingPracticeItems,
        supabase: options.supabase,
        userId: options.userId,
      });
  const deck = buildSavedEntriesPracticeReadModel({
    existingFlashcards: existingPracticeItems,
    favorites: options.savedDictionaryEntries,
    language: options.locale,
    latestReviewsByFlashcardId: latestReviewsByPracticeItemId,
    now: options.now,
    preferredDialect: options.preferredDialect,
  });

  return {
    deck: storageError ? withStorageBlockedDeck(deck) : deck,
    storageError,
  };
}

async function loadGeneratedPracticeDeck(options: {
  deckId: AppFlashcardDeckId;
  generatedSourcesByDeckId: ReadonlyMap<string, AppFlashcardCandidateSource[]>;
  now?: Date;
  supabase?: AppSupabaseClient;
  userId?: string;
}) {
  const candidateSources =
    options.generatedSourcesByDeckId.get(options.deckId) ?? [];
  const practiceItemsResult =
    options.supabase && options.userId
      ? await loadUserPracticeItemsForCandidates(
          options.supabase,
          options.userId,
          candidateSources.map(({ candidate }) => candidate),
        )
      : { data: [], error: null };
  const storageError = practiceItemsResult.error ?? null;
  const existingPracticeItems = storageError
    ? []
    : (practiceItemsResult.data ?? []);
  let latestReviewsByPracticeItemId = new Map<
    string,
    FlashcardReviewSnapshot
  >();

  if (!storageError && options.supabase && options.userId) {
    latestReviewsByPracticeItemId = await loadLatestReviewsByPracticeItemId({
      practiceItems: existingPracticeItems,
      supabase: options.supabase,
      userId: options.userId,
    });
  }

  const deck = buildDictionaryFlashcardsDeckReadModel({
    candidateSources,
    existingFlashcards: existingPracticeItems,
    latestReviewsByFlashcardId: latestReviewsByPracticeItemId,
    now: options.now,
    totalSourceEntries: candidateSources.length,
  });

  return {
    deck: storageError ? withStorageBlockedDeck(deck) : deck,
    storageError,
  };
}

export async function loadPracticePageData({
  activeDeckId = PUBLIC_DICTIONARY_FLASHCARD_DECK_ID,
  locale,
  supabase,
  user,
}: {
  activeDeckId?: AppFlashcardDeckId;
  locale: Language;
  supabase?: AppSupabaseClient;
  user?: User;
}): Promise<PracticePageData | null> {
  const isAuthenticated = Boolean(supabase && user);
  const profile = supabase && user ? await getProfile(supabase, user.id) : null;

  if (isAuthenticated && !profile) {
    return null;
  }

  if (!isAuthenticated && isPrivateFlashcardDeckId(activeDeckId)) {
    return null;
  }

  const entryFavorites =
    supabase && user ? await getUserEntryFavorites(supabase, user.id) : [];
  const savedDictionaryEntries = buildSavedDictionaryEntries(entryFavorites);
  const savedDeckPreview = buildSavedEntriesPracticeReadModel({
    existingFlashcards: [],
    favorites: savedDictionaryEntries,
    language: locale,
    preferredDialect: profile?.preferred_dictionary_dialect,
  });
  const dictionary = listDictionaryEntries();
  const grammarLessons = listPublishedGrammarLessons()
    .map((lesson) => getPublishedGrammarLessonBundleBySlug(lesson.slug))
    .filter(
      (
        lesson,
      ): lesson is NonNullable<
        ReturnType<typeof getPublishedGrammarLessonBundleBySlug>
      > => Boolean(lesson),
    );
  const generatedSourcesByDeckId = buildGeneratedSourcesByDeckId({
    dictionary,
    grammarLessons,
    locale,
  });
  const deckOptions = buildAppFlashcardDeckOptions({
    generatedSourcesByDeckId,
    savedDeck: savedDeckPreview,
  });
  const activeDeck = getFlashcardDeckDefinition(activeDeckId);
  let deckResult: {
    deck: FlashcardDeckReadModel<AppFlashcardCandidate>;
    storageError: PracticeStorageError | null;
  } | null = null;

  if (isPrivateFlashcardDeckId(activeDeckId)) {
    if (supabase && user && profile) {
      deckResult = await loadSavedEntriesPracticeDeck({
        locale,
        preferredDialect: profile.preferred_dictionary_dialect,
        savedDictionaryEntries,
        supabase,
        userId: user.id,
      });
    }
  } else {
    deckResult = await loadGeneratedPracticeDeck({
      deckId: activeDeckId,
      generatedSourcesByDeckId,
      supabase,
      userId: user?.id,
    });
  }

  if (!deckResult) {
    return null;
  }

  return {
    activeDeck,
    activeDeckId,
    deck: deckResult.deck,
    deckOptions,
    isAuthenticated,
    storageError: deckResult.storageError,
  };
}
