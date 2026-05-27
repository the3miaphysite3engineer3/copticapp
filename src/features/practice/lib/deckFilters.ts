import type {
  FlashcardDeckItem,
  FlashcardSourceType,
} from "@/features/practice/lib/core";
import type { AppFlashcardCandidate } from "@/features/practice/lib/deckRegistry";
import type { DictionaryFlashcardCandidate } from "@/features/practice/lib/dictionaryFlashcards";
import type { TranslationKey } from "@/lib/i18n";

export const FLASHCARD_DECK_FILTER_ALL = "all" as const;

export type FlashcardDeckFilterAll = typeof FLASHCARD_DECK_FILTER_ALL;

export type DictionaryFlashcardDeckFilters = {
  cardType: string | FlashcardDeckFilterAll;
  dialect: string | FlashcardDeckFilterAll;
  grammar: string | FlashcardDeckFilterAll;
  source: FlashcardSourceType | FlashcardDeckFilterAll;
};

export type DictionaryFlashcardCardTypeFilterOption = {
  count: number;
  labelKey: TranslationKey;
  value: string;
};

export type DictionaryFlashcardSourceFilterOption = {
  count: number;
  labelKey: TranslationKey;
  value: FlashcardSourceType;
};

export type DictionaryFlashcardDialectFilterOption = {
  count: number;
  value: string;
};

export type DictionaryFlashcardGrammarFilterOption = {
  code: string;
  count: number;
  labelKey: TranslationKey;
  value: string;
};

export type DictionaryFlashcardDeckFilterOptions = {
  cardTypes: DictionaryFlashcardCardTypeFilterOption[];
  dialects: DictionaryFlashcardDialectFilterOption[];
  grammars: DictionaryFlashcardGrammarFilterOption[];
  sources: DictionaryFlashcardSourceFilterOption[];
};

export const DEFAULT_DICTIONARY_FLASHCARD_DECK_FILTERS: DictionaryFlashcardDeckFilters =
  {
    cardType: FLASHCARD_DECK_FILTER_ALL,
    dialect: FLASHCARD_DECK_FILTER_ALL,
    grammar: FLASHCARD_DECK_FILTER_ALL,
    source: FLASHCARD_DECK_FILTER_ALL,
  };

function isDictionaryFlashcardCandidate(
  candidate: AppFlashcardCandidate,
): candidate is DictionaryFlashcardCandidate {
  return candidate.sourceType === "dictionary";
}

function getSourceTypeLabelKey(
  sourceType: FlashcardSourceType,
): TranslationKey {
  return sourceType === "grammar" ? "nav.grammar" : "nav.dictionary";
}

function getItemDialectFilterValue(
  item: FlashcardDeckItem<AppFlashcardCandidate>,
) {
  if (!isDictionaryFlashcardCandidate(item.candidate)) {
    return null;
  }

  return item.candidate.displayDialect ?? item.candidate.selectedDialect;
}

function getItemGrammarFilterValue(
  item: FlashcardDeckItem<AppFlashcardCandidate>,
) {
  if (!isDictionaryFlashcardCandidate(item.candidate)) {
    return null;
  }

  return item.candidate.metadata.partOfSpeech;
}

function incrementCount<TOption extends { count: number }>(
  map: Map<string, TOption>,
  key: string,
  option: Omit<TOption, "count">,
) {
  const existingOption = map.get(key);

  if (existingOption) {
    existingOption.count += 1;
    return;
  }

  map.set(key, { ...option, count: 1 } as TOption);
}

export function getDictionaryFlashcardDeckFilterOptions(
  items: readonly FlashcardDeckItem<AppFlashcardCandidate>[],
): DictionaryFlashcardDeckFilterOptions {
  const cardTypes = new Map<string, DictionaryFlashcardCardTypeFilterOption>();
  const dialects = new Map<string, DictionaryFlashcardDialectFilterOption>();
  const grammars = new Map<string, DictionaryFlashcardGrammarFilterOption>();
  const sources = new Map<string, DictionaryFlashcardSourceFilterOption>();

  for (const item of items) {
    incrementCount(sources, item.candidate.sourceType, {
      labelKey: getSourceTypeLabelKey(item.candidate.sourceType),
      value: item.candidate.sourceType,
    });
    incrementCount(cardTypes, item.candidate.template, {
      labelKey: item.candidate.metadata.templateLabelKey,
      value: item.candidate.template,
    });

    const dialect = getItemDialectFilterValue(item);
    const grammar = getItemGrammarFilterValue(item);

    if (dialect) {
      incrementCount(dialects, dialect, {
        value: dialect,
      });
    }

    if (grammar && isDictionaryFlashcardCandidate(item.candidate)) {
      incrementCount(grammars, grammar, {
        code: item.candidate.metadata.partOfSpeechCode,
        labelKey: item.candidate.metadata.partOfSpeechLabelKey,
        value: grammar,
      });
    }
  }

  return {
    cardTypes: Array.from(cardTypes.values()),
    dialects: Array.from(dialects.values()).sort((left, right) =>
      left.value.localeCompare(right.value),
    ),
    grammars: Array.from(grammars.values()).sort((left, right) =>
      left.value.localeCompare(right.value),
    ),
    sources: Array.from(sources.values()).sort((left, right) =>
      left.value.localeCompare(right.value),
    ),
  };
}

export function hasActiveDictionaryFlashcardDeckFilters(
  filters: DictionaryFlashcardDeckFilters,
) {
  return (
    filters.cardType !== FLASHCARD_DECK_FILTER_ALL ||
    filters.dialect !== FLASHCARD_DECK_FILTER_ALL ||
    filters.grammar !== FLASHCARD_DECK_FILTER_ALL ||
    filters.source !== FLASHCARD_DECK_FILTER_ALL
  );
}

export function filterDictionaryFlashcardDeckItems({
  filters,
  items,
}: {
  filters: DictionaryFlashcardDeckFilters;
  items: readonly FlashcardDeckItem<AppFlashcardCandidate>[];
}) {
  return items.filter((item) => {
    if (
      filters.source !== FLASHCARD_DECK_FILTER_ALL &&
      item.candidate.sourceType !== filters.source
    ) {
      return false;
    }

    if (
      filters.cardType !== FLASHCARD_DECK_FILTER_ALL &&
      item.candidate.template !== filters.cardType
    ) {
      return false;
    }

    if (
      filters.dialect !== FLASHCARD_DECK_FILTER_ALL &&
      getItemDialectFilterValue(item) !== filters.dialect
    ) {
      return false;
    }

    if (
      filters.grammar !== FLASHCARD_DECK_FILTER_ALL &&
      getItemGrammarFilterValue(item) !== filters.grammar
    ) {
      return false;
    }

    return true;
  });
}
