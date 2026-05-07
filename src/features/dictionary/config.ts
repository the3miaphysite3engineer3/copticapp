import type { TranslationKey } from "@/lib/i18n";

import {
  DICTIONARY_PART_OF_SPEECH_CODES,
  DICTIONARY_PART_OF_SPEECH_FILTER_CODES,
  getPartOfSpeechDisplayCode,
  getPartOfSpeechLabelKey,
  normalizePartOfSpeechCode,
} from "./grammarRegistry";

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

export type DictionaryDialectCode = (typeof DICTIONARY_DIALECT_CODES)[number];
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
 * Normalizes dictionary part-of-speech codes into the compact set used by the
 * current dictionary UI.
 */
export function normalizePartOfSpeech(value: string): PartOfSpeech {
  return normalizePartOfSpeechCode(value);
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
