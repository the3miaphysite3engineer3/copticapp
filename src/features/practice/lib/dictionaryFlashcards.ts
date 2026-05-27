import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  getPartOfSpeechCode,
  type DialectFilter,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import { getPartOfSpeechLabelKey } from "@/features/dictionary/grammarRegistry";
import {
  getPreferredEntryDialectKey,
  getPreferredEntryDisplaySpelling,
} from "@/features/dictionary/lib/entryDisplay";
import {
  getEntryNounGender,
  getEntryVerbValencies,
  getPrimaryEntryPartOfSpeech,
} from "@/features/dictionary/lib/entryGrammar";
import {
  getLocalizedMeaningValues,
  toPlainText,
} from "@/features/dictionary/lib/entryText";
import type {
  DictionarySenseGrammarValency,
  LexicalEntry,
  LexicalGender,
} from "@/features/dictionary/types";
import type {
  FlashcardBack,
  FlashcardCandidate,
  FlashcardSide,
} from "@/features/practice/lib/core";
import { getTranslation, type TranslationKey } from "@/lib/i18n";
import { getEntryPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";

export const DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING =
  "coptic_to_meaning" as const;
const DICTIONARY_FLASHCARD_TEMPLATE_MEANING_TO_COPTIC =
  "meaning_to_coptic" as const;
const DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_PART_OF_SPEECH =
  "coptic_to_part_of_speech" as const;
const DICTIONARY_FLASHCARD_TEMPLATES = [
  DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING,
  DICTIONARY_FLASHCARD_TEMPLATE_MEANING_TO_COPTIC,
  DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_PART_OF_SPEECH,
] as const;
export const DEFAULT_DICTIONARY_FLASHCARD_TEMPLATES =
  DICTIONARY_FLASHCARD_TEMPLATES;
const DEFAULT_DICTIONARY_FLASHCARD_MEANING_LIMIT = 3;

export type DictionaryFlashcardTemplate =
  (typeof DICTIONARY_FLASHCARD_TEMPLATES)[number];
export type DictionaryFlashcardSideKind = "coptic" | "grammar" | "meaning";

export type DictionaryFlashcardSide =
  FlashcardSide<DictionaryFlashcardSideKind>;

export type DictionaryFlashcardBack =
  FlashcardBack<DictionaryFlashcardSideKind> & {
    meanings: string[];
  };

type DictionaryFlashcardMetadata = {
  canSpeak: boolean;
  copticText: string;
  grammarText: string;
  headword: string;
  partOfSpeech: ReturnType<typeof getPrimaryEntryPartOfSpeech>;
  partOfSpeechCode: string;
  partOfSpeechLabelKey: TranslationKey;
  speechText: string | null;
  answerSpeechText: string | null;
  templateLabelKey: TranslationKey;
};

export type DictionaryFlashcardCandidate = FlashcardCandidate<
  "dictionary",
  DictionaryFlashcardTemplate,
  DictionaryFlashcardMetadata,
  DictionaryFlashcardSideKind
> & {
  back: DictionaryFlashcardBack;
  displayDialect: DictionaryDialectCode | null;
  entryId: number;
  entryPath: string;
  front: DictionaryFlashcardSide;
  selectedDialect: DialectFilter;
  source: "dictionary";
};

type DictionaryFlashcardCandidateKeyOptions = {
  entryId: number;
  language: Language;
  selectedDialect: DialectFilter;
  template?: DictionaryFlashcardTemplate;
};

type BuildDictionaryFlashcardCandidateOptions = {
  entry: LexicalEntry;
  language: Language;
  meaningLimit?: number;
  selectedDialect?: DialectFilter;
  template?: DictionaryFlashcardTemplate;
};

type BuildDictionaryFlashcardCandidatesOptions = Omit<
  BuildDictionaryFlashcardCandidateOptions,
  "entry"
> & {
  entries: readonly LexicalEntry[];
  templates?: readonly DictionaryFlashcardTemplate[];
};

const VERB_VALENCY_LABEL_KEYS: Record<
  DictionarySenseGrammarValency,
  TranslationKey
> = {
  INTR: "entry.abbreviation.intr",
  TR: "entry.abbreviation.tr",
};

function normalizeFlashcardText(value: string) {
  return toPlainText(value).replace(/\s+/g, " ").trim();
}

function getMeaningLimit(limit: number | undefined) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return DEFAULT_DICTIONARY_FLASHCARD_MEANING_LIMIT;
  }

  return Math.max(1, Math.trunc(limit));
}

function getDictionaryFlashcardMeaningValues(
  entry: LexicalEntry,
  language: Language,
  limit: number,
) {
  const seenKeys = new Set<string>();
  const values: string[] = [];

  for (const meaning of getLocalizedMeaningValues(entry, language)) {
    const normalizedMeaning = normalizeFlashcardText(meaning);
    const meaningKey = normalizedMeaning.toLocaleLowerCase();

    if (!normalizedMeaning || seenKeys.has(meaningKey)) {
      continue;
    }

    seenKeys.add(meaningKey);
    values.push(normalizedMeaning);

    if (values.length >= limit) {
      break;
    }
  }

  return values;
}

function getDictionaryFlashcardTemplateLabelKey(
  template: DictionaryFlashcardTemplate,
): TranslationKey {
  if (template === DICTIONARY_FLASHCARD_TEMPLATE_MEANING_TO_COPTIC) {
    return "practice.template.meaningToCoptic";
  }

  if (template === DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_PART_OF_SPEECH) {
    return "practice.template.copticToPartOfSpeech";
  }

  return "practice.template.copticToMeaning";
}

function getPartOfSpeechText(
  partOfSpeech: ReturnType<typeof getPrimaryEntryPartOfSpeech>,
  language: Language,
) {
  const label = getTranslation(language, getPartOfSpeechLabelKey(partOfSpeech));
  const code = getPartOfSpeechCode(partOfSpeech);

  return code ? `${label} (${code})` : label;
}

function getGenderText(gender: LexicalGender | undefined, language: Language) {
  if (gender === "M") {
    return getTranslation(language, "entry.gender.masculine");
  }

  if (gender === "F") {
    return getTranslation(language, "entry.gender.feminine");
  }

  if (gender === "BOTH") {
    return [
      getTranslation(language, "entry.gender.masculine"),
      getTranslation(language, "entry.gender.feminine"),
    ].join("/");
  }

  return "";
}

function getValencyText(
  valencies: readonly DictionarySenseGrammarValency[],
  language: Language,
) {
  return valencies
    .map((valency) =>
      getTranslation(language, VERB_VALENCY_LABEL_KEYS[valency]),
    )
    .join("/");
}

function getGrammarAnswerText({
  entry,
  language,
  partOfSpeech,
}: {
  entry: LexicalEntry;
  language: Language;
  partOfSpeech: ReturnType<typeof getPrimaryEntryPartOfSpeech>;
}) {
  const values = [getPartOfSpeechText(partOfSpeech, language)];

  if (partOfSpeech === "N") {
    const genderText = getGenderText(getEntryNounGender(entry), language);

    if (genderText) {
      values.push(genderText);
    }
  } else if (partOfSpeech === "V") {
    const valencyText = getValencyText(getEntryVerbValencies(entry), language);

    if (valencyText) {
      values.push(valencyText);
    }
  }

  return values.join(", ");
}

function getDictionaryFlashcardSides(options: {
  copticText: string;
  grammarText: string;
  language: Language;
  meanings: readonly string[];
  partOfSpeech: ReturnType<typeof getPrimaryEntryPartOfSpeech>;
  template: DictionaryFlashcardTemplate;
}): { back: DictionaryFlashcardBack; front: DictionaryFlashcardSide } | null {
  if (
    options.template === DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_PART_OF_SPEECH
  ) {
    if (options.partOfSpeech === "UNKNOWN") {
      return null;
    }

    return {
      back: {
        kind: "grammar",
        labelKey: "practice.side.partOfSpeech",
        meanings: [...options.meanings],
        text: options.grammarText,
      },
      front: {
        kind: "coptic",
        labelKey: "practice.side.coptic",
        text: options.copticText,
      },
    };
  }

  if (options.meanings.length === 0) {
    return null;
  }

  if (options.template === DICTIONARY_FLASHCARD_TEMPLATE_MEANING_TO_COPTIC) {
    return {
      back: {
        kind: "coptic",
        labelKey: "practice.side.coptic",
        meanings: [...options.meanings],
        text: options.copticText,
      },
      front: {
        kind: "meaning",
        labelKey: "practice.side.meaning",
        text: options.meanings.join("; "),
      },
    };
  }

  return {
    back: {
      kind: "meaning",
      labelKey: "practice.side.meaning",
      meanings: [...options.meanings],
      text: options.meanings.join("; "),
    },
    front: {
      kind: "coptic",
      labelKey: "practice.side.coptic",
      text: options.copticText,
    },
  };
}

export function getDictionaryFlashcardCandidateId({
  entryId,
  language,
  selectedDialect,
  template = DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING,
}: DictionaryFlashcardCandidateKeyOptions) {
  return `dictionary:${entryId}:${template}:${language}:${selectedDialect}`;
}

export function isDictionaryFlashcardTemplate(
  value: string | null | undefined,
): value is DictionaryFlashcardTemplate {
  return DICTIONARY_FLASHCARD_TEMPLATES.includes(
    value as DictionaryFlashcardTemplate,
  );
}

/**
 * Derives one dictionary flashcard template from one lexical entry.
 * Dictionary JSON remains the source of truth; this helper only prepares the
 * stable front/back text and metadata needed by future UI and persistence.
 */
export function buildDictionaryFlashcardCandidate({
  entry,
  language,
  meaningLimit,
  selectedDialect = DEFAULT_DICTIONARY_DIALECT_FILTER,
  template = DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING,
}: BuildDictionaryFlashcardCandidateOptions): DictionaryFlashcardCandidate | null {
  const copticText = normalizeFlashcardText(
    getPreferredEntryDisplaySpelling(entry, selectedDialect),
  );
  const meanings = getDictionaryFlashcardMeaningValues(
    entry,
    language,
    getMeaningLimit(meaningLimit),
  );

  if (!copticText) {
    return null;
  }

  const displayDialect = getPreferredEntryDialectKey(entry, selectedDialect);
  const partOfSpeech = getPrimaryEntryPartOfSpeech(entry);
  const grammarText = getGrammarAnswerText({ entry, language, partOfSpeech });
  const sides = getDictionaryFlashcardSides({
    copticText,
    grammarText,
    language,
    meanings,
    partOfSpeech,
    template,
  });

  if (!sides) {
    return null;
  }

  const canSpeak = displayDialect === "B";
  const frontSpeechText =
    canSpeak && sides.front.kind === "coptic" ? sides.front.text : null;
  const answerSpeechText =
    canSpeak && sides.back.kind === "coptic" ? sides.back.text : null;
  const entryPath = getEntryPath(entry.id, language);

  return {
    back: sides.back,
    displayDialect: displayDialect ?? null,
    entryId: entry.id,
    entryPath,
    front: sides.front,
    id: getDictionaryFlashcardCandidateId({
      entryId: entry.id,
      language,
      selectedDialect,
      template,
    }),
    language,
    metadata: {
      canSpeak,
      copticText,
      grammarText,
      headword: normalizeFlashcardText(entry.headword),
      partOfSpeech,
      partOfSpeechCode: getPartOfSpeechCode(partOfSpeech),
      partOfSpeechLabelKey: getPartOfSpeechLabelKey(partOfSpeech),
      speechText: frontSpeechText,
      answerSpeechText,
      templateLabelKey: getDictionaryFlashcardTemplateLabelKey(template),
    },
    links: [
      {
        href: entryPath,
        labelKey: "practice.saved.openEntry",
      },
    ],
    selectedDialect,
    source: "dictionary",
    sourceId: String(entry.id),
    sourceType: "dictionary",
    template,
    variantKey: selectedDialect,
  };
}

/**
 * Builds flashcard candidates for a list of dictionary entries, skipping
 * entries that cannot produce a useful front and back.
 */
export function buildDictionaryFlashcardCandidates({
  entries,
  templates = [DICTIONARY_FLASHCARD_TEMPLATE_COPTIC_TO_MEANING],
  ...options
}: BuildDictionaryFlashcardCandidatesOptions) {
  return entries.flatMap((entry) =>
    templates.flatMap((template) => {
      const candidate = buildDictionaryFlashcardCandidate({
        entry,
        template,
        ...options,
      });

      return candidate ? [candidate] : [];
    }),
  );
}
