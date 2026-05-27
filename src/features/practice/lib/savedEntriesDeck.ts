import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  type DialectFilter,
} from "@/features/dictionary/config";
import type { EntryFavoriteWithEntry } from "@/features/dictionary/lib/entryActions";
import {
  buildDictionaryFlashcardsDeckReadModel,
  type DictionaryFlashcardCandidateSource,
  type DictionaryFlashcardReviewSnapshot,
  type DictionaryFlashcardsDeckReadModel,
  type DictionaryFlashcardsDeckStats,
} from "@/features/practice/lib/dictionaryDecks";
import {
  DEFAULT_DICTIONARY_FLASHCARD_TEMPLATES,
  buildDictionaryFlashcardCandidates,
} from "@/features/practice/lib/dictionaryFlashcards";
import type { DictionaryFlashcardRow } from "@/features/practice/types";
import type { Language } from "@/types/i18n";

export type SavedEntriesPracticeStats = DictionaryFlashcardsDeckStats;
export type SavedEntriesPracticeReadModel = DictionaryFlashcardsDeckReadModel;

type BuildSavedEntriesPracticeReadModelOptions = {
  existingFlashcards: readonly DictionaryFlashcardRow[];
  favorites: readonly EntryFavoriteWithEntry[];
  language: Language;
  latestReviewsByFlashcardId?: ReadonlyMap<
    string,
    DictionaryFlashcardReviewSnapshot
  >;
  now?: Date;
  preferredDialect?: DialectFilter | null;
  queueLimit?: number;
};

export function buildSavedEntriesPracticeReadModel({
  existingFlashcards,
  favorites,
  language,
  latestReviewsByFlashcardId,
  now,
  preferredDialect = DEFAULT_DICTIONARY_DIALECT_FILTER,
  queueLimit,
}: BuildSavedEntriesPracticeReadModelOptions): SavedEntriesPracticeReadModel {
  const selectedDialect = preferredDialect ?? DEFAULT_DICTIONARY_DIALECT_FILTER;
  let missingEntries = 0;
  const candidateSources = favorites.flatMap(
    (favorite): DictionaryFlashcardCandidateSource[] => {
      if (!favorite.entry) {
        missingEntries += 1;
        return [];
      }

      const candidates = buildDictionaryFlashcardCandidates({
        entries: [favorite.entry],
        language,
        selectedDialect,
        templates: DEFAULT_DICTIONARY_FLASHCARD_TEMPLATES,
      });

      if (candidates.length === 0) {
        missingEntries += 1;
        return [];
      }

      return candidates.map((candidate) => ({
        candidate,
        sourceCreatedAt: favorite.favorite.created_at,
      }));
    },
  );

  return buildDictionaryFlashcardsDeckReadModel({
    candidateSources,
    existingFlashcards,
    latestReviewsByFlashcardId,
    missingEntries,
    now,
    queueLimit,
    totalSourceEntries: favorites.length,
  });
}
