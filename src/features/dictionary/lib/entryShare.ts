import { getEntryPath } from "@/lib/locale";
import type { Language } from "@/types/i18n";

import { buildEntryPreview } from "./entryPreview";

import type { LexicalEntry } from "../types";

export type EntrySharePayload = {
  copyText: string;
  relatedForms: string[];
  text: string;
  title: string;
  url: string;
};

type BuildEntrySharePayloadOptions = {
  entry: LexicalEntry;
  language: Language;
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
  url: string;
};

/**
 * Ensures a summary line ends with terminal punctuation before it is embedded
 * into share text.
 */
function ensureSentence(value: string) {
  if (!value) {
    return "";
  }

  return /[.!?]$/.test(value) ? value : `${value}.`;
}

/**
 * Resolves the share URL for an entry, preferring the current browser URL and
 * otherwise reconstructing it from the localized entry path.
 */
export function resolveEntryShareUrl(
  entryId: string,
  language: Language,
  currentUrl?: string,
) {
  if (currentUrl) {
    return currentUrl;
  }

  const pathname = getEntryPath(entryId, language);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl) {
    return pathname;
  }

  return new URL(pathname, baseUrl).toString();
}

/**
 * Builds the share payload used by native share, clipboard copy, and social
 * share links for one dictionary entry.
 */
export function buildEntrySharePayload({
  entry,
  language,
  parentEntry = null,
  relatedEntries = [],
  url,
}: BuildEntrySharePayloadOptions): EntrySharePayload {
  const preview = buildEntryPreview({
    entry,
    language,
    parentEntry,
    relatedEntries,
  });
  const displayForm = preview.heading;
  const summary = ensureSentence(preview.gloss);
  const relatedForms = preview.relatedForms;
  let relatedLine = "";

  if (relatedForms.length > 0) {
    relatedLine =
      language === "nl"
        ? `Verwante vormen: ${relatedForms.join(" • ")}`
        : `Related forms: ${relatedForms.join(" • ")}`;
  }

  const lines =
    language === "nl"
      ? [
          `Koptisch woordenboeklemma: ${displayForm}`,
          summary || "Een lemma uit het Koptische woordenboek.",
          relatedLine,
        ]
      : [
          `Coptic dictionary entry: ${displayForm}`,
          summary || "A featured entry from the Coptic dictionary.",
          relatedLine,
        ];

  const text = lines.filter(Boolean).join("\n");
  const title =
    language === "nl"
      ? `${displayForm} | Koptisch woordenboek`
      : `${displayForm} | Coptic Dictionary`;

  return {
    copyText: `${text}\n${url}`,
    relatedForms,
    text,
    title,
    url,
  };
}

/**
 * Builds the platform-specific social share URLs for an entry share payload.
 */
export function buildEntryShareLinks(payload: EntrySharePayload) {
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedText = encodeURIComponent(payload.text);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };
}
