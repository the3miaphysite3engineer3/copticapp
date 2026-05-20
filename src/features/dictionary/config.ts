import type { TranslationKey } from "@/lib/i18n";

import {
  DICTIONARY_PART_OF_SPEECH_CODES,
  DICTIONARY_PART_OF_SPEECH_FILTER_CODES,
  getPartOfSpeechDisplayCode,
  getPartOfSpeechLabelKey,
} from "./grammarRegistry.ts";

export const DICTIONARY_DIALECT_CODES = [
  "A",
  "B",
  "F",
  "Fb",
  "L",
  "M",
  "Sl",
  "O",
  "S",
  "Sa",
  "Sf",
] as const;

export const ANALYTICS_DIALECTS = [
  "ALL",
  "S",
  "B",
  "A",
  "L",
  "F",
  "M",
] as const;

export const PARTS_OF_SPEECH = DICTIONARY_PART_OF_SPEECH_CODES;
export const DICTIONARY_SENSE_CODES = [
  "N",
  "V",
  "ADJ",
  "ADV",
  "CONJ",
  "PREP",
  "PRON",
  "INTR",
  "TR",
  "STA",
  "IMP",
  "PC",
  "REFL",
  "AUX",
  "IMPERS.V",
  "IMPERS",
  "PFX",
  "SFX",
  "DAT",
  "OBJ",
  "NEG",
  "INDF",
  "Q",
  "CAUS",
  "SIM",
  "REL",
  "PL",
  "SG",
  "LIT",
  "VBAL",
  "ESP",
  "ABS",
] as const;

export const DICTIONARY_PREP_GOVERNMENT_FORMS = [
  // Sahidic
  "ⲉ-/ⲉⲣⲟ=",
  "ⲉϫⲛ-/ⲉϫⲱ=",
  "ⲉⲧⲃⲉ-/ⲉⲧⲃⲏⲏⲧ=",
  "ⲙⲛ-/ⲛⲙⲙⲁ=",
  "ⲟⲩⲃⲉ-/ⲟⲩⲃⲏ=",
  "ϩⲛ-/ⲛϩⲏⲧ=",
  "ϩⲁ-/ϩⲁⲣⲟ=",
  "ϩⲓ-/ϩⲓⲱⲱ=",
  "ϩⲓϫⲛ-/ϩⲓϫⲱ=",
  "ϩⲓⲧⲛ-/ϩⲓⲧⲟⲟⲧ=",
  "ϣⲁ-/ϣⲁⲣⲟ=",
  "ⲛ-/ⲛⲁ=",
  "ⲛ-/ⲙⲙⲟ=",
  // Bohairic
  "ⲉϫⲉⲛ-/ⲉϫⲱ=",
  "ⲉⲑⲃⲉ-/ⲉⲑⲃⲏⲧ=",
  "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
  "ⳳⲉⲛ-/ⲛⳳⲏⲧ=",
  "ϩⲓ-/ϩⲓⲱⲧ=",
  "ϩⲓϫⲉⲛ-/ϩⲓϫⲱ=",
  "ϩⲓⲧⲉⲛ-/ϩⲓⲧⲟⲧ=",
] as const;

export const DICTIONARY_PREP_GOVERNMENT_FOR_DIALECT: Record<
  "S" | "B",
  readonly string[]
> = {
  S: [
    "ⲉ-/ⲉⲣⲟ=",
    "ⲉϫⲛ-/ⲉϫⲱ=",
    "ⲉⲧⲃⲉ-/ⲉⲧⲃⲏⲏⲧ=",
    "ⲙⲛ-/ⲛⲙⲙⲁ=",
    "ⲟⲩⲃⲉ-/ⲟⲩⲃⲏ=",
    "ϩⲛ-/ⲛϩⲏⲧ=",
    "ϩⲁ-/ϩⲁⲣⲟ=",
    "ϩⲓ-/ϩⲓⲱⲱ=",
    "ϩⲓϫⲛ-/ϩⲓϫⲱ=",
    "ϩⲓⲧⲛ-/ϩⲓⲧⲟⲟⲧ=",
    "ϣⲁ-/ϣⲁⲣⲟ=",
    "ⲛ-/ⲛⲁ=",
    "ⲛ-/ⲙⲙⲟ=",
  ],
  B: [
    "ⲉ-/ⲉⲣⲟ=",
    "ⲉϫⲉⲛ-/ⲉϫⲱ=",
    "ⲉⲑⲃⲉ-/ⲉⲑⲃⲏⲧ=",
    "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
    "ⲟⲩⲃⲉ-/ⲟⲩⲃⲏ=",
    "ⳳⲉⲛ-/ⲛⳳⲏⲧ=",
    "ϩⲁ-/ϩⲁⲣⲟ=",
    "ϩⲓ-/ϩⲓⲱⲧ=",
    "ϩⲓϫⲉⲛ-/ϩⲓϫⲱ=",
    "ϩⲓⲧⲉⲛ-/ϩⲓⲧⲟⲧ=",
    "ϣⲁ-/ϣⲁⲣⲟ=",
    "ⲛ-/ⲛⲁ=",
    "ⲛ-/ⲙⲙⲟ=",
  ],
};

export const DICTIONARY_COMPLEMENTIZER_GOVERNMENT_FORMS = [
  "ϫⲉ-",
  "ϫⲉⲕⲁⲥ",
] as const;

export const DICTIONARY_CONSTRUCTION_GOVERNMENT_FORMS = [
  "ⲛⲑⲉ ⲛ-",
  "ⲙⲫⲣⲏϯ ⲛ-",
  "ⲱⲥ",
] as const;

export type DictionaryDialectCode = (typeof DICTIONARY_DIALECT_CODES)[number];
export type DictionaryComplementizerGovernment =
  (typeof DICTIONARY_COMPLEMENTIZER_GOVERNMENT_FORMS)[number];
export type DictionaryConstructionGovernment =
  (typeof DICTIONARY_CONSTRUCTION_GOVERNMENT_FORMS)[number];
export type DictionaryPrepGovernment =
  (typeof DICTIONARY_PREP_GOVERNMENT_FORMS)[number];
export type DictionarySenseCode = (typeof DICTIONARY_SENSE_CODES)[number];
export type AnalyticsDialect = (typeof ANALYTICS_DIALECTS)[number];
export type DialectFilter = AnalyticsDialect;
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];
export type DictionaryPartOfSpeechFilter =
  | "ALL"
  | "V"
  | "N"
  | "ADJ"
  | "ADV"
  | "PREP";

type DialectOption = {
  value: DialectFilter;
  labelKey: TranslationKey;
};

type PartOfSpeechOption = {
  value: DictionaryPartOfSpeechFilter;
  labelKey: TranslationKey;
};

const DIALECT_LABEL_KEYS: Record<
  "ALL" | DictionaryDialectCode,
  TranslationKey
> = {
  ALL: "dialect.ALL",
  A: "dialect.A",
  B: "dialect.B",
  F: "dialect.F",
  Fb: "dialect.Fb",
  L: "dialect.L",
  M: "dialect.M",
  Sl: "dialect.Sl",
  O: "dialect.O",
  S: "dialect.S",
  Sa: "dialect.Sa",
  Sf: "dialect.Sf",
};

export const DEFAULT_DICTIONARY_DIALECT_FILTER: DialectFilter = "B";
export const DEFAULT_PART_OF_SPEECH_FILTER: DictionaryPartOfSpeechFilter =
  "ALL";

export const dialectFilterOptions = [
  { value: "ALL", labelKey: "dialect.ALL" },
  { value: "S", labelKey: "dialect.S" },
  { value: "B", labelKey: "dialect.B" },
  { value: "A", labelKey: "dialect.A" },
  { value: "L", labelKey: "dialect.L" },
  { value: "F", labelKey: "dialect.F" },
  { value: "M", labelKey: "dialect.M" },
] as const satisfies readonly DialectOption[];

export const dictionaryPartOfSpeechFilterOptions = [
  { value: "ALL", labelKey: "dict.any" },
  ...DICTIONARY_PART_OF_SPEECH_FILTER_CODES.map((value) => ({
    value,
    labelKey: getPartOfSpeechLabelKey(value),
  })),
] as const satisfies readonly PartOfSpeechOption[];

export function getDialectLabelKey(siglum: string): TranslationKey | undefined {
  if (siglum === "La") {
    return DIALECT_LABEL_KEYS.Sl;
  }

  return DIALECT_LABEL_KEYS[siglum as keyof typeof DIALECT_LABEL_KEYS];
}

export function getDialectFilterOptionLabel(
  dialect: DialectFilter,
  translate: (key: TranslationKey) => string,
) {
  const label = translate(DIALECT_LABEL_KEYS[dialect]);
  return dialect === "ALL" ? label : `${label} (${dialect})`;
}

export function getPartOfSpeechFilterLabel(
  partOfSpeech: DictionaryPartOfSpeechFilter,
  translate: (key: TranslationKey) => string,
) {
  const option = dictionaryPartOfSpeechFilterOptions.find(
    (candidate) => candidate.value === partOfSpeech,
  );

  return option ? translate(option.labelKey) : partOfSpeech;
}

/**
 * Returns the stable short code shown in compact UI badges.
 */
export function getPartOfSpeechCode(value: string) {
  return getPartOfSpeechDisplayCode(value);
}

/**
 * Returns the localized part-of-speech label for entry metadata and assistive
 * text without exposing stored dictionary codes.
 */
export function getPartOfSpeechLabel(
  value: string,
  translate: (key: TranslationKey) => string,
) {
  return translate(getPartOfSpeechLabelKey(value));
}

export function isDialectFilter(value: string): value is DialectFilter {
  return ANALYTICS_DIALECTS.includes(value as DialectFilter);
}

/**
 * Validates the public dictionary part-of-speech filter accepted by the
 * dictionary page and search API.
 */
export function isDictionaryPartOfSpeechFilter(
  value: string,
): value is DictionaryPartOfSpeechFilter {
  return dictionaryPartOfSpeechFilterOptions.some(
    (option) => option.value === value,
  );
}
