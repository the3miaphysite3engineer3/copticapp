import type { GrammarLessonBundle } from "@/content/grammar/schema";
import type { LexicalEntry } from "@/features/dictionary/types";
import type {
  FlashcardCandidateSource,
  FlashcardDeckSummary,
} from "@/features/practice/lib/core";
import {
  dictionaryFlashcardSourceAdapter,
  DEFAULT_DICTIONARY_FLASHCARD_DECK_ID,
  type DictionaryFlashcardDeckId,
} from "@/features/practice/lib/dictionaryDecks";
import type { DictionaryFlashcardCandidate } from "@/features/practice/lib/dictionaryFlashcards";
import {
  grammarFlashcardSourceAdapter,
  type GrammarFlashcardCandidate,
  type GrammarFlashcardDeckId,
} from "@/features/practice/lib/grammarFlashcards";
import type { Language } from "@/types/i18n";

export const MIXED_FLASHCARD_DECK_ID = "mixed-dictionary-grammar" as const;
const MIXED_FLASHCARD_SOURCE_LIMIT = 120;

type FlashcardDeckRegistryContext = {
  dictionary: {
    entries: readonly LexicalEntry[];
  };
  grammar: {
    lessons: readonly GrammarLessonBundle[];
  };
};

export type AppFlashcardCandidate =
  | DictionaryFlashcardCandidate
  | GrammarFlashcardCandidate;

export type AppFlashcardDeckId =
  | DictionaryFlashcardDeckId
  | GrammarFlashcardDeckId
  | typeof MIXED_FLASHCARD_DECK_ID;

type MixedFlashcardDeckScope = {
  sourceTypes: readonly ["dictionary", "grammar"];
};

export type MixedFlashcardDeckSummary = FlashcardDeckSummary<
  typeof MIXED_FLASHCARD_DECK_ID,
  MixedFlashcardDeckScope,
  "mixed"
>;

type MixedFlashcardDeckDefinition = MixedFlashcardDeckSummary & {
  sourceDeckIds: readonly (
    | DictionaryFlashcardDeckId
    | GrammarFlashcardDeckId
  )[];
  sourceLimit?: number;
};

export type AppFlashcardDeckSummary =
  | ReturnType<typeof dictionaryFlashcardSourceAdapter.toDeckSummary>
  | ReturnType<typeof grammarFlashcardSourceAdapter.toDeckSummary>
  | MixedFlashcardDeckSummary;

export type AppFlashcardDeckOption = AppFlashcardDeckSummary & {
  sourceCount: number;
};

export type AppFlashcardCandidateSource =
  FlashcardCandidateSource<AppFlashcardCandidate>;

const MIXED_FLASHCARD_DECK_DEFINITIONS: readonly MixedFlashcardDeckDefinition[] =
  [
    {
      descriptionKey: "practice.deck.mixedDictionaryGrammar.description",
      id: MIXED_FLASHCARD_DECK_ID,
      kind: "mixed",
      scope: {
        sourceTypes: ["dictionary", "grammar"],
      },
      scopeLabelKey: "practice.deckScope.mixedDictionaryGrammar",
      sourceDeckIds: ["bohairic-nouns", "grammar-lesson-1"],
      sourceLimit: MIXED_FLASHCARD_SOURCE_LIMIT,
      titleKey: "practice.deck.mixedDictionaryGrammar.title",
    },
  ];

function interleaveCandidateSources(
  sourceLists: readonly AppFlashcardCandidateSource[][],
) {
  const sources: AppFlashcardCandidateSource[] = [];
  const maxLength = Math.max(0, ...sourceLists.map((list) => list.length));

  for (let index = 0; index < maxLength; index += 1) {
    for (const sourceList of sourceLists) {
      const source = sourceList[index];

      if (source) {
        sources.push(source);
      }
    }
  }

  return sources;
}

function toMixedFlashcardDeckSummary(
  deck: MixedFlashcardDeckDefinition,
): MixedFlashcardDeckSummary {
  return {
    descriptionKey: deck.descriptionKey,
    id: deck.id,
    kind: deck.kind,
    scope: deck.scope,
    scopeLabelKey: deck.scopeLabelKey,
    titleKey: deck.titleKey,
  };
}

function getMixedFlashcardDeckDefinition(id: typeof MIXED_FLASHCARD_DECK_ID) {
  return (
    MIXED_FLASHCARD_DECK_DEFINITIONS.find((deck) => deck.id === id) ??
    MIXED_FLASHCARD_DECK_DEFINITIONS[0]
  );
}

function isMixedFlashcardDeckId(
  value: string | null | undefined,
): value is typeof MIXED_FLASHCARD_DECK_ID {
  return value === MIXED_FLASHCARD_DECK_ID;
}

export function buildGeneratedFlashcardSourcesByDeckId({
  context,
  language,
}: {
  context: FlashcardDeckRegistryContext;
  language: Language;
}) {
  const sourcesByDeckId = new Map<string, AppFlashcardCandidateSource[]>();

  for (const deck of dictionaryFlashcardSourceAdapter.getDeckDefinitions()) {
    if (deck.kind === "generated") {
      sourcesByDeckId.set(
        deck.id,
        dictionaryFlashcardSourceAdapter.listCandidateSources({
          context: {
            dictionary: context.dictionary.entries,
          },
          deckId: deck.id,
          language,
        }),
      );
    }
  }

  for (const deck of grammarFlashcardSourceAdapter.getDeckDefinitions()) {
    if (deck.kind === "generated") {
      sourcesByDeckId.set(
        deck.id,
        grammarFlashcardSourceAdapter.listCandidateSources({
          context: {
            lessons: context.grammar.lessons,
          },
          deckId: deck.id,
          language,
        }),
      );
    }
  }

  for (const deck of MIXED_FLASHCARD_DECK_DEFINITIONS) {
    const sourceLimit =
      typeof deck.sourceLimit === "number" && Number.isFinite(deck.sourceLimit)
        ? Math.max(1, Math.trunc(deck.sourceLimit))
        : MIXED_FLASHCARD_SOURCE_LIMIT;
    const sourceLists = deck.sourceDeckIds.map(
      (sourceDeckId) => sourcesByDeckId.get(sourceDeckId) ?? [],
    );

    sourcesByDeckId.set(
      deck.id,
      interleaveCandidateSources(sourceLists).slice(0, sourceLimit),
    );
  }

  return sourcesByDeckId;
}

export function buildFlashcardDeckOptions({
  getSourceCount,
}: {
  getSourceCount: (deckId: string) => number;
}) {
  const adapterOptions = [
    ...dictionaryFlashcardSourceAdapter.getDeckDefinitions().map((deck) => ({
      ...dictionaryFlashcardSourceAdapter.toDeckSummary(deck),
      sourceCount: getSourceCount(deck.id),
    })),
    ...grammarFlashcardSourceAdapter.getDeckDefinitions().map((deck) => ({
      ...grammarFlashcardSourceAdapter.toDeckSummary(deck),
      sourceCount: getSourceCount(deck.id),
    })),
  ];
  const mixedOptions = MIXED_FLASHCARD_DECK_DEFINITIONS.map((deck) => ({
    ...toMixedFlashcardDeckSummary(deck),
    sourceCount: getSourceCount(deck.id),
  }));
  const savedDeckOption = adapterOptions.find(
    (option) => option.id === DEFAULT_DICTIONARY_FLASHCARD_DECK_ID,
  );
  const remainingAdapterOptions = adapterOptions.filter(
    (option) => option.id !== DEFAULT_DICTIONARY_FLASHCARD_DECK_ID,
  );

  return [
    ...(savedDeckOption ? [savedDeckOption] : []),
    ...mixedOptions,
    ...remainingAdapterOptions,
  ] satisfies AppFlashcardDeckOption[];
}

export function isFlashcardDeckId(
  value: string | null | undefined,
): value is AppFlashcardDeckId {
  return (
    dictionaryFlashcardSourceAdapter.isDeckId(value) ||
    grammarFlashcardSourceAdapter.isDeckId(value) ||
    isMixedFlashcardDeckId(value)
  );
}

export function isPrivateFlashcardDeckId(
  value: string | null | undefined,
): value is typeof DEFAULT_DICTIONARY_FLASHCARD_DECK_ID {
  return value === DEFAULT_DICTIONARY_FLASHCARD_DECK_ID;
}

export function getFlashcardDeckDefinition(
  id: AppFlashcardDeckId,
): AppFlashcardDeckSummary {
  if (dictionaryFlashcardSourceAdapter.isDeckId(id)) {
    return dictionaryFlashcardSourceAdapter.toDeckSummary(
      dictionaryFlashcardSourceAdapter.getDeckDefinition(id),
    );
  }

  if (grammarFlashcardSourceAdapter.isDeckId(id)) {
    return grammarFlashcardSourceAdapter.toDeckSummary(
      grammarFlashcardSourceAdapter.getDeckDefinition(id),
    );
  }

  return toMixedFlashcardDeckSummary(getMixedFlashcardDeckDefinition(id));
}
