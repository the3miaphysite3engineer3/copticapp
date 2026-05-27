export type GrammarLocale = "en" | "nl";
export type Localized<T> = Record<GrammarLocale, T>;

export type GrammarLessonId = string;
export type GrammarSectionId = string;
export type GrammarConceptId = string;
export type GrammarExampleId = string;
export type GrammarExerciseId = string;
export type GrammarFlashcardSeedId = string;
export type GrammarFootnoteId = string;
export type GrammarSourceId = string;

export type GrammarLessonStatus = "draft" | "published" | "archived";

export type GrammarRights = {
  author: string;
  copyrightHolder: string;
  license: "all-rights-reserved";
  statement: Localized<string>;
};

export type GrammarManifest = {
  schemaVersion: "1.0.0";
  datasetVersion: string;
  generatedAt: string;
  locales: GrammarLocale[];
  rights: GrammarRights;
  lessons: GrammarLessonIndexItem[];
};

export type GrammarLessonIndexItem = {
  id: GrammarLessonId;
  slug: string;
  number: number;
  status: GrammarLessonStatus;
  title: Localized<string>;
  summary: Localized<string>;
  tags: string[];
};

export type GrammarLessonDocument = {
  id: GrammarLessonId;
  slug: string;
  number: number;
  status: GrammarLessonStatus;
  title: Localized<string>;
  summary: Localized<string>;
  description?: Localized<string>;
  tags: string[];
  rights?: GrammarRights;
  sectionOrder: GrammarSectionId[];
  sections: GrammarSectionDocument[];
  conceptRefs: GrammarConceptId[];
  exerciseRefs: GrammarExerciseId[];
  sourceRefs: GrammarSourceId[];
};

export type GrammarSectionDocument = {
  id: GrammarSectionId;
  slug: string;
  lessonId: GrammarLessonId;
  order: number;
  title: Localized<string>;
  summary?: Localized<string>;
  tags: string[];
  blocks: Localized<GrammarBlock[]>;
  conceptRefs: GrammarConceptId[];
  exampleRefs: GrammarExampleId[];
  exerciseRefs: GrammarExerciseId[];
};

export type GrammarConceptDocument = {
  id: GrammarConceptId;
  title: Localized<string>;
  definition: Localized<GrammarBlock[]>;
  tags: string[];
  relatedConceptRefs: GrammarConceptId[];
  lessonRefs: GrammarLessonId[];
  sourceRefs: GrammarSourceId[];
};

export type GrammarExampleDocument = {
  id: GrammarExampleId;
  lessonId: GrammarLessonId;
  sectionId: GrammarSectionId;
  coptic: string;
  copticSegments?: GrammarExampleSegment[];
  transliteration?: string;
  translation: Localized<string>;
  notes?: Localized<GrammarBlock[]>;
  conceptRefs: GrammarConceptId[];
  dictionaryRefs: string[];
  dictionaryTokenOverrides?: Record<string, string>;
  tags: string[];
};

export type GrammarExampleSegment = {
  text: string;
  dictionaryEntryId?: string;
};

export type GrammarExerciseDocument = {
  id: GrammarExerciseId;
  lessonId: GrammarLessonId;
  sectionId?: GrammarSectionId;
  kind: "translation" | "multiple-choice" | "short-answer" | "reviewed";
  title: Localized<string>;
  prompt: Localized<GrammarBlock[]>;
  items: GrammarExerciseItem[];
  tags: string[];
};

export type GrammarExerciseItem = {
  id: string;
  prompt: Localized<string>;
  answerSchema?: {
    kind: "free-text";
    minLength?: number;
    maxLength?: number;
  };
};

export type GrammarFlashcardTemplate =
  | "grammar_concept_to_definition"
  | "grammar_coptic_to_translation"
  | "grammar_translation_to_coptic";

export type GrammarFlashcardSideKind =
  | "coptic"
  | "grammar"
  | "meaning"
  | "text";

export type GrammarFlashcardSeedDocument = {
  id: GrammarFlashcardSeedId;
  lessonId: GrammarLessonId;
  lessonSlug: string;
  sectionId?: GrammarSectionId;
  template: GrammarFlashcardTemplate;
  category: "concept" | "example" | "exercise";
  front: Localized<string>;
  back: Localized<string>;
  frontKind: GrammarFlashcardSideKind;
  backKind: GrammarFlashcardSideKind;
  context: Localized<string>;
  focus: Localized<string>;
  hint?: Localized<string>;
  conceptRefs: GrammarConceptId[];
  exampleRef?: GrammarExampleId;
  exerciseRef?: GrammarExerciseId;
  sourceRefs: GrammarSourceId[];
  tags: string[];
};

export type GrammarFootnoteDocument = {
  id: GrammarFootnoteId;
  lessonId: GrammarLessonId;
  content: Localized<GrammarBlock[]>;
  sourceRefs: GrammarSourceId[];
};

export type GrammarSourceDocument = {
  id: GrammarSourceId;
  title: string;
  subtitle?: string;
  author?: string;
  year?: string;
  url?: string;
  publicationId?: string;
  comingSoon?: boolean;
};

export type GrammarInline =
  | { type: "text"; text: string }
  | { type: "coptic"; text: string; dictionaryEntryId?: string }
  | {
      type: "copticSpan";
      children: GrammarInline[];
      dictionaryEntryId?: string;
    }
  | { type: "strong"; children: GrammarInline[] }
  | { type: "em"; children: GrammarInline[] }
  | { type: "smallCaps"; children: GrammarInline[] }
  | { type: "underline"; children: GrammarInline[] }
  | { type: "superscript"; children: GrammarInline[] }
  | { type: "lineBreak" }
  | { type: "termRef"; ref: string; fallback?: string }
  | { type: "conceptRef"; ref: GrammarConceptId; fallback?: string }
  | { type: "footnoteRef"; ref: GrammarFootnoteId }
  | { type: "link"; href: string; children: GrammarInline[] };

export type GrammarBlock =
  | { type: "paragraph"; content: GrammarInline[] }
  | { type: "heading"; level: 2 | 3; id: string; content: GrammarInline[] }
  | {
      type: "list";
      style: "ordered" | "unordered";
      items: { id: string; blocks: GrammarBlock[] }[];
    }
  | {
      type: "table";
      id: string;
      columns: GrammarTableColumn[];
      headerRows?: GrammarTableHeaderRow[];
      rows: GrammarTableRow[];
      tableLayout?: "auto" | "fixed";
      mobileLayout?: "scroll" | "cards";
      hideHeader?: boolean;
      rowHeaderColumnId?: string;
    }
  | {
      type: "callout";
      tone: "info" | "note" | "warning";
      title?: Localized<string>;
      blocks: GrammarBlock[];
    }
  | { type: "exampleGroup"; refs: GrammarExampleId[]; columns?: 1 | 2 }
  | { type: "exerciseGroup"; refs: GrammarExerciseId[] };

export type GrammarTableColumn = {
  id: string;
  label: Localized<string>;
  inlineLabel?: Localized<GrammarInline[]>;
  width?: string;
};

export type GrammarTableHeaderRow = {
  id: string;
  cells: GrammarTableHeaderCell[];
};

type GrammarTableHeaderCell = {
  id: string;
  label: Localized<string>;
  inlineLabel?: Localized<GrammarInline[]>;
  colSpan?: number;
  rowSpan?: number;
  align?: "left" | "center" | "right";
};

export type GrammarTableRow = {
  id: string;
  cells: Record<string, GrammarBlock[]>;
};

export type GrammarDatasetSnapshot = {
  manifest: GrammarManifest;
  lessons: GrammarLessonDocument[];
  concepts: GrammarConceptDocument[];
  examples: GrammarExampleDocument[];
  exercises: GrammarExerciseDocument[];
  flashcardSeeds: GrammarFlashcardSeedDocument[];
  footnotes: GrammarFootnoteDocument[];
  sources: GrammarSourceDocument[];
};

export type GrammarLessonBundle = {
  lesson: GrammarLessonDocument;
  concepts: GrammarConceptDocument[];
  examples: GrammarExampleDocument[];
  exercises: GrammarExerciseDocument[];
  flashcardSeeds: GrammarFlashcardSeedDocument[];
  footnotes: GrammarFootnoteDocument[];
  sources: GrammarSourceDocument[];
};
