import { buildOpenGraphImageUrl } from "@/features/seo/lib/openGraph";
import { siteConfig } from "@/lib/site";
import type { Language } from "@/types/i18n";

import {
  buildEntryPreview,
  type EntryPreviewGenderedGlossRow,
  type EntryPreviewHeadingPart,
} from "./entryPreview";

import type { LexicalEntry } from "../types";

type BuildEntryOpenGraphPreviewOptions = {
  entry: LexicalEntry;
  language: Language;
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
};

type EntryOpenGraphPreview = {
  genderedGlossRows: EntryPreviewGenderedGlossRow[];
  gloss: string;
  heading: string;
  headingParts: EntryPreviewHeadingPart[];
  relatedForms: string[];
  strapline: string;
};

/**
 * Builds the `/api/og` image URL for one dictionary entry preview card.
 */
export function buildEntryOpenGraphImageUrl(
  entryId: string,
  language: Language,
  baseUrl = siteConfig.liveUrl,
) {
  return buildOpenGraphImageUrl({
    baseUrl,
    id: entryId,
    locale: language,
    type: "entry",
  });
}

/**
 * Builds the dictionary-entry Open Graph preview payload, including a
 * localized fallback gloss when the entry summary is empty.
 */
export function buildEntryOpenGraphPreview({
  entry,
  language,
  parentEntry = null,
  relatedEntries = [],
}: BuildEntryOpenGraphPreviewOptions): EntryOpenGraphPreview {
  const preview = buildEntryPreview({
    entry,
    language,
    parentEntry,
    relatedEntries,
  });

  return {
    genderedGlossRows: preview.genderedGlossRows,
    gloss:
      preview.gloss ||
      (language === "nl"
        ? "Koptisch woordenboeklemma"
        : "Coptic dictionary entry"),
    heading: preview.heading,
    headingParts: preview.headingParts,
    relatedForms: preview.relatedForms,
    strapline: language === "nl" ? "Koptisch woordenboek" : "Coptic Dictionary",
  };
}
