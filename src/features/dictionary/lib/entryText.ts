import { getPartOfSpeechLabel } from "@/features/dictionary/config";
import { DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS } from "@/features/dictionary/grammarRegistry";
import type { LexicalEntry } from "@/features/dictionary/types";
import { getTranslation } from "@/lib/i18n";
import type { Language } from "@/types/i18n";

const entryLeadIns = [
  ...DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS,
  "m",
  "f",
] as const;

export function toPlainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Removes imported grammar shorthand from the start of a gloss so metadata and
 * summaries surface the first real lexical meaning instead.
 */
function stripLeadIn(value: string) {
  let cleaned = toPlainText(value.replace(/\[[^\]]+\]/g, ""))
    .replace(/^[|―—–-]+\s*/, "")
    .trim();

  while (cleaned) {
    const lowered = cleaned.toLowerCase();
    const matchedLeadIn = entryLeadIns.find(
      (leadIn) =>
        lowered === leadIn ||
        lowered.startsWith(`${leadIn}:`) ||
        lowered.startsWith(`${leadIn},`) ||
        lowered.startsWith(`${leadIn} `),
    );

    if (!matchedLeadIn) {
      break;
    }

    cleaned = cleaned
      .slice(matchedLeadIn.length)
      .replace(/^[:.,;)\]\s-]+/, "")
      .trim();
  }

  return cleaned;
}

function isPureGrammarLeadIn(value: string) {
  if (!value) {
    return true;
  }

  return (
    /^[(?[a-z]\)?.,\s:-]+$/i.test(value) &&
    !/[\u03e2-\u03ef\u2c80-\u2cff]/i.test(value) &&
    value.split(/\s+/).length <= 4
  );
}

/**
 * Returns the first gloss that reads like a user-facing summary instead of a
 * bare grammar label or import shorthand fragment.
 */
export function getEntrySummary(entry: LexicalEntry, locale: Language = "en") {
  const meanings =
    locale === "nl" && entry.dutch_meanings
      ? entry.dutch_meanings
      : entry.english_meanings;

  for (const meaning of meanings) {
    const candidate = stripLeadIn(meaning);
    if (candidate && !isPureGrammarLeadIn(candidate)) {
      return candidate;
    }
  }

  return "";
}

/**
 * Builds the meta description used for dictionary entry pages from the chosen
 * headword, part of speech, and first meaningful gloss when available.
 */
export function buildEntryDescription(
  entry: LexicalEntry,
  locale: Language = "en",
) {
  const headword = toPlainText(entry.headword);
  const firstMeaning = getEntrySummary(entry, locale);
  const partOfSpeech = getPartOfSpeechLabel(entry.pos, (key) =>
    getTranslation(locale, key),
  );

  if (locale === "nl") {
    return firstMeaning
      ? `${headword} (${partOfSpeech}) in het Koptische woordenboek. ${firstMeaning}.`
      : `${headword} (${partOfSpeech}) in het Koptische woordenboek van Coptic Compass.`;
  }

  return firstMeaning
    ? `${headword} (${partOfSpeech}) in the Coptic dictionary. ${firstMeaning}.`
    : `${headword} (${partOfSpeech}) in the Coptic dictionary on Coptic Compass.`;
}
