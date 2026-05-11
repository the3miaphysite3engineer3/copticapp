import type {
  DictionaryDialectCode,
  DictionaryMeaningGroupCode,
  PartOfSpeech,
} from "@/features/dictionary/config";

/**
 * Shared dictionary domain types used by the build pipeline, search helpers,
 * and entry UI.
 */
export type LexicalGender = "" | "BOTH" | "F" | "M";
export type DictionaryGenderedMeaningMarker = "f" | "m" | "pl";
export type LexicalRelationType =
  | "feminine-counterpart"
  | "derived-subentry"
  | "paradigm-member";

export interface DialectFormVariants {
  absolute?: string[];
  constructParticiples?: string[];
  nominal?: string[];
  pronominal?: string[];
  stative?: string[];
}

/**
 * A derived lexical compound built from a dialect-specific construct
 * participle. These are not variants of the base form.
 */
export interface ConstructParticipleCompound {
  form: string;
  sourceConstructParticiple?: string;
  gender?: LexicalGender;
  english_meanings: string[];
  dutch_meanings?: string[];
}

export interface DialectForms {
  absolute?: string;
  constructParticipleCompounds?: ConstructParticipleCompound[];
  constructParticiples?: string[];
  imperatives?: string[];
  nominal?: string;
  pronominal?: string;
  stative?: string;
  variants?: DialectFormVariants;
}

export type DictionaryDialectFormsMap = Partial<
  Record<DictionaryDialectCode, DialectForms>
>;
export type DictionaryPluralFormCode = DictionaryDialectCode;

interface DictionaryMeaningGroup {
  dutch_meanings?: string[];
  dutch_notes?: string[];
  english_meanings?: string[];
  english_notes?: string[];
}

export type DictionaryMeaningGroups = Partial<
  Record<DictionaryMeaningGroupCode, DictionaryMeaningGroup>
>;

export type DictionaryGenderedMeaningValues = Partial<
  Record<DictionaryGenderedMeaningMarker, string>
>;

export interface DictionaryGenderedMeaning {
  english: DictionaryGenderedMeaningValues;
  dutch?: DictionaryGenderedMeaningValues;
}

export interface DictionaryDialectMeaning {
  sourceLabel: string;
  dialects: DictionaryDialectCode[];
  dutch_meanings?: string[];
  dutch_notes?: string[];
  english_meanings?: string[];
  english_notes?: string[];
}

/**
 * Represents one normalized dictionary entry as consumed by the app and the
 * generated public JSON snapshot.
 */
export interface LexicalEntry {
  id: string;
  headword: string;
  dialects: DictionaryDialectFormsMap;
  pos: PartOfSpeech;
  gender: LexicalGender;
  parentEntryId?: string;
  relationType?: LexicalRelationType;
  meaningGroups?: DictionaryMeaningGroups;
  genderedMeanings?: DictionaryGenderedMeaning[];
  dialectMeanings?: DictionaryDialectMeaning[];
  english_meanings: string[];
  dutch_meanings?: string[];
  greek_equivalents: string[];
  bohairicParadigmData?: unknown;
  etymology?: "Egy" | "Gr";
  pluralForms?: Partial<Record<DictionaryPluralFormCode, string[]>>;
}

export type DictionaryGenderedCounterpart = Pick<
  LexicalEntry,
  "dialects" | "gender" | "headword" | "id" | "pluralForms" | "relationType"
>;

/**
 * Represents the reduced dictionary shape needed by search-result cards and
 * analytics drilldowns.
 */
export type DictionaryClientEntry = Pick<
  LexicalEntry,
  | "dialects"
  | "dialectMeanings"
  | "dutch_meanings"
  | "english_meanings"
  | "etymology"
  | "gender"
  | "genderedMeanings"
  | "headword"
  | "id"
  | "meaningGroups"
  | "pluralForms"
  | "pos"
  | "relationType"
> & {
  genderedCounterparts?: DictionaryGenderedCounterpart[];
  greek_equivalents?: string[];
};
