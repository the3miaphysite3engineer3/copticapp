import type {
  FlashcardCandidate,
  FlashcardCandidateSource,
  FlashcardDeckSummary,
  FlashcardSourceType,
} from "@/features/practice/lib/core";
import type { Language } from "@/types/i18n";

export type FlashcardSourceAdapter<
  TSourceType extends FlashcardSourceType,
  TDeckId extends string,
  TDeckDefinition extends FlashcardDeckSummary<TDeckId>,
  TCandidate extends FlashcardCandidate<TSourceType>,
  TContext,
> = {
  getDeckDefinition: (deckId: TDeckId) => TDeckDefinition;
  getDeckDefinitions: () => readonly TDeckDefinition[];
  isDeckId: (value: string | null | undefined) => value is TDeckId;
  listCandidateSources: (options: {
    context: TContext;
    deckId: TDeckId;
    language: Language;
  }) => FlashcardCandidateSource<TCandidate>[];
  sourceType: TSourceType;
  toDeckSummary: (deck: TDeckDefinition) => FlashcardDeckSummary<TDeckId>;
};
