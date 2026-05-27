import type { FlashcardReviewRating } from "@/features/practice/types";
import type { TranslationKey } from "@/lib/i18n";
import type { Language } from "@/types/i18n";

export type FlashcardSourceType = "dictionary" | "grammar";

export type FlashcardSideKind = "coptic" | "grammar" | "meaning" | "text";

export type FlashcardSide<TKind extends string = FlashcardSideKind> = {
  kind: TKind;
  labelKey: TranslationKey;
  text: string;
};

export type FlashcardBack<TKind extends string = FlashcardSideKind> =
  FlashcardSide<TKind> & {
    meanings: string[];
  };

export type FlashcardCandidateLink = {
  href: string;
  labelKey: TranslationKey;
};

export type FlashcardCandidate<
  TSourceType extends FlashcardSourceType = FlashcardSourceType,
  TTemplate extends string = string,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
  TSideKind extends string = FlashcardSideKind,
> = {
  back: FlashcardBack<TSideKind>;
  front: FlashcardSide<TSideKind>;
  id: string;
  language: Language;
  links?: FlashcardCandidateLink[];
  metadata: TMetadata;
  sourceId: string;
  sourceType: TSourceType;
  template: TTemplate;
  variantKey: string;
};

export type FlashcardCandidateSource<
  TCandidate extends FlashcardCandidate = FlashcardCandidate,
> = {
  candidate: TCandidate;
  sourceCreatedAt?: string | null;
};

export type FlashcardDeckKind = "generated" | "saved" | "mixed";

export type FlashcardDeckStatus = "due" | "new" | "scheduled";

export type FlashcardDeckSummary<
  TDeckId extends string = string,
  TScope = Record<string, unknown>,
  TKind extends FlashcardDeckKind = FlashcardDeckKind,
> = {
  descriptionKey: TranslationKey;
  id: TDeckId;
  kind: TKind;
  scope?: TScope;
  scopeLabelKey?: TranslationKey;
  titleKey: TranslationKey;
};

export type FlashcardDeckItem<
  TCandidate extends FlashcardCandidate = FlashcardCandidate,
> = {
  candidate: TCandidate;
  dueAt: string | null;
  flashcardId: string | null;
  lastReviewRating: FlashcardReviewRating | null;
  lastReviewedAt: string | null;
  recentReviewRatings: FlashcardReviewRating[];
  sourceCreatedAt: string | null;
  status: FlashcardDeckStatus;
};

export type FlashcardReviewSnapshot = {
  flashcardId: string;
  rating: FlashcardReviewRating;
  recentRatings: FlashcardReviewRating[];
  reviewedAt: string;
};

export type FlashcardDeckStats = {
  availableCards: number;
  dueCards: number;
  missingEntries: number;
  newCards: number;
  queuedCards: number;
  scheduledCards: number;
  totalSourceEntries: number;
};

export type FlashcardDeckReadModel<
  TCandidate extends FlashcardCandidate = FlashcardCandidate,
> = {
  items: FlashcardDeckItem<TCandidate>[];
  nextDueAt: string | null;
  queue: FlashcardDeckItem<TCandidate>[];
  stats: FlashcardDeckStats;
};
