import type {
  GrammarFlashcardSeedDocument,
  GrammarFlashcardSideKind,
  GrammarFlashcardTemplate,
  GrammarLessonBundle,
} from "@/content/grammar/schema";
import { getPublishedGrammarLessonBundleBySlug } from "@/features/grammar/lib/grammarDataset";
import { getGrammarLessonPath } from "@/features/grammar/lib/grammarPaths";
import type {
  FlashcardBack,
  FlashcardCandidate,
  FlashcardCandidateSource,
  FlashcardDeckKind,
  FlashcardDeckSummary,
  FlashcardSide,
} from "@/features/practice/lib/core";
import type { FlashcardSourceAdapter } from "@/features/practice/lib/sourceAdapters";
import type { TranslationKey } from "@/lib/i18n";
import type { Language } from "@/types/i18n";

export const GRAMMAR_FLASHCARD_DECK_IDS = ["grammar-lesson-1"] as const;
const GRAMMAR_FLASHCARD_VARIANT_KEY = "default";

const GRAMMAR_FLASHCARD_DECK_SOURCE_LIMIT = 80;

const GRAMMAR_FLASHCARD_TEMPLATES = [
  "grammar_concept_to_definition",
  "grammar_coptic_to_translation",
  "grammar_translation_to_coptic",
] as const satisfies readonly GrammarFlashcardTemplate[];

export type GrammarFlashcardDeckId =
  (typeof GRAMMAR_FLASHCARD_DECK_IDS)[number];

type GrammarFlashcardDeckKind = Extract<FlashcardDeckKind, "generated">;

type GrammarFlashcardDeckScope = {
  lessonNumber: number;
  lessonSlug: string;
  sourceType: "grammar";
};

type GrammarFlashcardDeckSummary = FlashcardDeckSummary<
  GrammarFlashcardDeckId,
  GrammarFlashcardDeckScope,
  GrammarFlashcardDeckKind
>;

type GrammarFlashcardDeckDefinition = GrammarFlashcardDeckSummary & {
  lessonSlug: string;
  sourceLimit?: number;
};

export type GrammarFlashcardMetadata = {
  category: GrammarFlashcardSeedDocument["category"];
  contextText: string;
  focusText: string;
  hintText: string | null;
  lessonSlug: string;
  lessonTitle: string;
  sectionId: string | null;
  sourceLabelKey: TranslationKey;
  templateLabelKey: TranslationKey;
};

export type GrammarFlashcardSide = FlashcardSide<GrammarFlashcardSideKind>;

export type GrammarFlashcardBack = FlashcardBack<GrammarFlashcardSideKind> & {
  meanings: string[];
};

export type GrammarFlashcardCandidate = FlashcardCandidate<
  "grammar",
  GrammarFlashcardTemplate,
  GrammarFlashcardMetadata,
  GrammarFlashcardSideKind
> & {
  back: GrammarFlashcardBack;
  front: GrammarFlashcardSide;
  lessonPath: string;
  seedId: string;
  source: "grammar";
};

type GrammarFlashcardCandidateSource =
  FlashcardCandidateSource<GrammarFlashcardCandidate>;

type GrammarFlashcardSourceContext = {
  lessons: readonly GrammarLessonBundle[];
};

type BuildGrammarFlashcardCandidateOptions = {
  language: Language;
  lesson: GrammarLessonBundle;
  seed: GrammarFlashcardSeedDocument;
};

const GRAMMAR_FLASHCARD_DECK_DEFINITIONS: readonly GrammarFlashcardDeckDefinition[] =
  [
    {
      descriptionKey: "practice.deck.grammarLesson1.description",
      id: "grammar-lesson-1",
      kind: "generated",
      lessonSlug: "lesson-1",
      scope: {
        lessonNumber: 1,
        lessonSlug: "lesson-1",
        sourceType: "grammar",
      },
      scopeLabelKey: "practice.deckScope.grammarLesson1",
      sourceLimit: GRAMMAR_FLASHCARD_DECK_SOURCE_LIMIT,
      titleKey: "practice.deck.grammarLesson1.title",
    },
  ];

function getGrammarFlashcardTemplateLabelKey(
  template: GrammarFlashcardTemplate,
): TranslationKey {
  if (template === "grammar_coptic_to_translation") {
    return "practice.template.grammarCopticToTranslation";
  }

  if (template === "grammar_translation_to_coptic") {
    return "practice.template.grammarTranslationToCoptic";
  }

  return "practice.template.grammarConceptToDefinition";
}

function getGrammarFlashcardSideLabelKey(options: {
  kind: GrammarFlashcardSideKind;
  role: "front" | "back";
  template: GrammarFlashcardTemplate;
}): TranslationKey {
  if (options.kind === "coptic") {
    return "practice.side.coptic";
  }

  if (options.template === "grammar_concept_to_definition") {
    return options.role === "front"
      ? "practice.side.grammarConcept"
      : "practice.side.definition";
  }

  if (options.kind === "meaning") {
    return "practice.side.translation";
  }

  if (options.kind === "grammar") {
    return "practice.side.grammarConcept";
  }

  return "practice.side.prompt";
}

function getGrammarFlashcardCandidateId(options: {
  language: Language;
  seedId: string;
  template: GrammarFlashcardTemplate;
  variantKey?: string;
}) {
  return [
    "grammar",
    options.seedId,
    options.template,
    options.language,
    options.variantKey ?? GRAMMAR_FLASHCARD_VARIANT_KEY,
  ].join(":");
}

function getGrammarFlashcardBackMeanings(seed: GrammarFlashcardSeedDocument) {
  if (seed.backKind === "meaning") {
    return [seed.back.en, seed.back.nl].filter(
      (value, index, values) => value && values.indexOf(value) === index,
    );
  }

  return [seed.focus.en, seed.focus.nl].filter(
    (value, index, values) => value && values.indexOf(value) === index,
  );
}

function isGrammarFlashcardDeckId(
  value: string | null | undefined,
): value is GrammarFlashcardDeckId {
  return GRAMMAR_FLASHCARD_DECK_IDS.includes(value as GrammarFlashcardDeckId);
}

export function isGrammarFlashcardTemplate(
  value: string | null | undefined,
): value is GrammarFlashcardTemplate {
  return GRAMMAR_FLASHCARD_TEMPLATES.includes(
    value as GrammarFlashcardTemplate,
  );
}

function getGrammarFlashcardDeckDefinitions() {
  return GRAMMAR_FLASHCARD_DECK_DEFINITIONS;
}

function getGrammarFlashcardDeckDefinition(id: GrammarFlashcardDeckId) {
  return (
    GRAMMAR_FLASHCARD_DECK_DEFINITIONS.find((deck) => deck.id === id) ??
    GRAMMAR_FLASHCARD_DECK_DEFINITIONS[0]
  );
}

function toGrammarFlashcardDeckSummary(
  deck: GrammarFlashcardDeckDefinition,
): GrammarFlashcardDeckSummary {
  return {
    descriptionKey: deck.descriptionKey,
    id: deck.id,
    kind: deck.kind,
    scope: deck.scope,
    scopeLabelKey: deck.scopeLabelKey,
    titleKey: deck.titleKey,
  };
}

function buildGrammarFlashcardCandidate({
  language,
  lesson,
  seed,
}: BuildGrammarFlashcardCandidateOptions): GrammarFlashcardCandidate {
  const frontText = seed.front[language];
  const backText = seed.back[language];
  const lessonPath = getGrammarLessonPath(seed.lessonSlug, language);

  return {
    back: {
      kind: seed.backKind,
      labelKey: getGrammarFlashcardSideLabelKey({
        kind: seed.backKind,
        role: "back",
        template: seed.template,
      }),
      meanings: getGrammarFlashcardBackMeanings(seed),
      text: backText,
    },
    front: {
      kind: seed.frontKind,
      labelKey: getGrammarFlashcardSideLabelKey({
        kind: seed.frontKind,
        role: "front",
        template: seed.template,
      }),
      text: frontText,
    },
    id: getGrammarFlashcardCandidateId({
      language,
      seedId: seed.id,
      template: seed.template,
    }),
    language,
    lessonPath,
    links: [
      {
        href: lessonPath,
        labelKey: "practice.saved.openLesson",
      },
    ],
    metadata: {
      category: seed.category,
      contextText: seed.context[language],
      focusText: seed.focus[language],
      hintText: seed.hint?.[language] ?? null,
      lessonSlug: seed.lessonSlug,
      lessonTitle: lesson.lesson.title[language],
      sectionId: seed.sectionId ?? null,
      sourceLabelKey: "nav.grammar",
      templateLabelKey: getGrammarFlashcardTemplateLabelKey(seed.template),
    },
    seedId: seed.id,
    source: "grammar",
    sourceId: seed.id,
    sourceType: "grammar",
    template: seed.template,
    variantKey: GRAMMAR_FLASHCARD_VARIANT_KEY,
  };
}

export function buildGrammarFlashcardCandidateByIdentity({
  language,
  sourceId,
  template,
  variantKey,
}: {
  language: Language;
  sourceId: string;
  template: GrammarFlashcardTemplate;
  variantKey?: string;
}) {
  if (variantKey && variantKey !== GRAMMAR_FLASHCARD_VARIANT_KEY) {
    return null;
  }

  for (const deck of GRAMMAR_FLASHCARD_DECK_DEFINITIONS) {
    const lesson = getPublishedGrammarLessonBundleBySlug(deck.lessonSlug);
    const seed = lesson?.flashcardSeeds.find(
      (candidate) =>
        candidate.id === sourceId && candidate.template === template,
    );

    if (lesson && seed) {
      return buildGrammarFlashcardCandidate({ language, lesson, seed });
    }
  }

  return null;
}

export function buildGeneratedGrammarFlashcardSources({
  deckId,
  language,
  lessons,
}: {
  deckId: GrammarFlashcardDeckId;
  language: Language;
  lessons: readonly GrammarLessonBundle[];
}): GrammarFlashcardCandidateSource[] {
  const deck = getGrammarFlashcardDeckDefinition(deckId);
  const lesson = lessons.find(
    (candidate) => candidate.lesson.slug === deck.lessonSlug,
  );

  if (!lesson) {
    return [];
  }

  const sourceLimit =
    typeof deck.sourceLimit === "number" && Number.isFinite(deck.sourceLimit)
      ? Math.max(1, Math.trunc(deck.sourceLimit))
      : GRAMMAR_FLASHCARD_DECK_SOURCE_LIMIT;

  return lesson.flashcardSeeds
    .map((seed) => ({
      candidate: buildGrammarFlashcardCandidate({
        language,
        lesson,
        seed,
      }),
      sourceCreatedAt: null,
    }))
    .slice(0, sourceLimit);
}

export const grammarFlashcardSourceAdapter = {
  getDeckDefinition: getGrammarFlashcardDeckDefinition,
  getDeckDefinitions: getGrammarFlashcardDeckDefinitions,
  isDeckId: isGrammarFlashcardDeckId,
  listCandidateSources: ({ context, deckId, language }) =>
    buildGeneratedGrammarFlashcardSources({
      deckId,
      language,
      lessons: context.lessons,
    }),
  sourceType: "grammar",
  toDeckSummary: toGrammarFlashcardDeckSummary,
} satisfies FlashcardSourceAdapter<
  "grammar",
  GrammarFlashcardDeckId,
  GrammarFlashcardDeckDefinition,
  GrammarFlashcardCandidate,
  GrammarFlashcardSourceContext
>;
