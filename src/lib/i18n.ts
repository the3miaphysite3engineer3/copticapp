import { apiDocsMessages } from "@/lib/translations/apiDocs";
import { contactMessages } from "@/lib/translations/contact";
import { contributorsMessages } from "@/lib/translations/contributors";
import { developersMessages } from "@/lib/translations/developers";
import { dictionaryMessages } from "@/lib/translations/dictionary";
import { grammarMessages } from "@/lib/translations/grammar";
import { homeMessages } from "@/lib/translations/home";
import { loginMessages } from "@/lib/translations/login";
import { practiceMessages } from "@/lib/translations/practice";
import { publicationsMessages } from "@/lib/translations/publications";
import { sharedMessages } from "@/lib/translations/shared";
import type { Language } from "@/types/i18n";

export type { Language };

const en = {
  ...sharedMessages.en,
  ...homeMessages.en,
  ...publicationsMessages.en,
  ...dictionaryMessages.en,
  ...practiceMessages.en,
  ...grammarMessages.en,
  ...contactMessages.en,
  ...loginMessages.en,
  ...developersMessages.en,
  ...contributorsMessages.en,
  ...apiDocsMessages.en,
} as const;

export type TranslationKey = keyof typeof en;
type TranslationDictionary = Readonly<Record<TranslationKey, string>>;

const nl = {
  ...sharedMessages.nl,
  ...homeMessages.nl,
  ...publicationsMessages.nl,
  ...dictionaryMessages.nl,
  ...practiceMessages.nl,
  ...grammarMessages.nl,
  ...contactMessages.nl,
  ...loginMessages.nl,
  ...developersMessages.nl,
  ...contributorsMessages.nl,
  ...apiDocsMessages.nl,
} satisfies TranslationDictionary;

const translations = {
  en,
  nl,
} satisfies Record<Language, TranslationDictionary>;

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "app-language";

/**
 * Narrows an arbitrary string to one of the supported application locales.
 */
export function isLanguage(value: string): value is Language {
  return value === "en" || value === "nl";
}

/**
 * Returns the localized message string for a validated language and
 * translation key pair.
 */
export function getTranslation(
  language: Language,
  key: TranslationKey,
): string {
  return translations[language][key];
}
