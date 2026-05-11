import type { Language } from "@/types/i18n";

import {
  formatGenderedHeadingParts,
  getGenderedHeadingParts,
  getPreferredEntryDisplaySpelling,
  type GenderedHeadingMarker,
} from "./entryDisplay";
import {
  getEntrySummary,
  getLocalizedGenderedMeanings,
  toPlainText,
} from "./entryText";

import type { DictionaryGenderedCounterpart, LexicalEntry } from "../types";

type EntryPreviewOptions = {
  entry: LexicalEntry;
  language: Language;
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
};

export type EntryPreviewGenderedGlossRow = {
  values: Array<{
    marker: GenderedHeadingMarker;
    meaning: string;
  }>;
};

export type EntryPreviewHeadingPart = {
  marker: GenderedHeadingMarker;
  spelling: string;
};

type EntryPreview = {
  genderedGlossRows: EntryPreviewGenderedGlossRow[];
  gloss: string;
  heading: string;
  headingParts: EntryPreviewHeadingPart[];
  relatedForms: string[];
};

function getDisplayForm(entry: LexicalEntry) {
  return toPlainText(getPreferredEntryDisplaySpelling(entry));
}

function getGenderedCounterpartCandidates(
  parentEntry: LexicalEntry | null | undefined,
  relatedEntries: readonly LexicalEntry[],
): DictionaryGenderedCounterpart[] {
  return [parentEntry, ...relatedEntries].filter(
    (entry): entry is LexicalEntry => Boolean(entry),
  );
}

function buildPreviewHeading({
  entry,
  parentEntry,
  relatedEntries = [],
}: Omit<EntryPreviewOptions, "language">) {
  const genderedHeadingParts = getGenderedHeadingParts(
    entry,
    getGenderedCounterpartCandidates(parentEntry, relatedEntries),
  );

  if (genderedHeadingParts.length > 0) {
    return {
      heading: formatGenderedHeadingParts(genderedHeadingParts),
      headingParts: genderedHeadingParts.map(({ marker, spelling }) => ({
        marker,
        spelling,
      })),
      includedForms: genderedHeadingParts.map((part) => part.spelling),
    };
  }

  const heading = getDisplayForm(entry);

  return {
    heading,
    headingParts: [],
    includedForms: heading ? [heading] : [],
  };
}

function getGenderedGlossRows(
  entry: LexicalEntry,
  language: Language,
): EntryPreviewGenderedGlossRow[] {
  return getLocalizedGenderedMeanings(entry, language).map((row) => ({
    values: row.values,
  }));
}

function formatGenderedGlossRows(
  rows: readonly EntryPreviewGenderedGlossRow[],
) {
  return rows
    .map((row) =>
      row.values
        .map(({ marker, meaning }) => `${marker} ${meaning}`)
        .join("; "),
    )
    .filter(Boolean)
    .join("; ");
}

function buildPreviewGloss(
  entry: LexicalEntry,
  language: Language,
  genderedGlossRows: readonly EntryPreviewGenderedGlossRow[],
) {
  return (
    formatGenderedGlossRows(genderedGlossRows) ||
    getEntrySummary(entry, language)
  );
}

function collectRelatedForms(
  entry: LexicalEntry,
  parentEntry: LexicalEntry | null | undefined,
  relatedEntries: readonly LexicalEntry[],
  includedForms: readonly string[],
) {
  const forms: string[] = [];
  const seenIds = new Set([entry.id]);
  const seenForms = new Set(includedForms.filter(Boolean));

  for (const candidate of [parentEntry, ...relatedEntries]) {
    if (!candidate || seenIds.has(candidate.id)) {
      continue;
    }

    seenIds.add(candidate.id);

    const form = getDisplayForm(candidate);
    if (!form || seenForms.has(form)) {
      continue;
    }

    seenForms.add(form);
    forms.push(form);

    if (forms.length === 2) {
      break;
    }
  }

  return forms;
}

/**
 * Builds the plain-text dictionary-entry preview shared by page metadata,
 * generated Open Graph images, and user-facing share text.
 */
export function buildEntryPreview({
  entry,
  language,
  parentEntry = null,
  relatedEntries = [],
}: EntryPreviewOptions): EntryPreview {
  const { heading, headingParts, includedForms } = buildPreviewHeading({
    entry,
    parentEntry,
    relatedEntries,
  });
  const genderedGlossRows = getGenderedGlossRows(entry, language);

  return {
    genderedGlossRows,
    gloss: buildPreviewGloss(entry, language, genderedGlossRows),
    heading,
    headingParts,
    relatedForms: collectRelatedForms(
      entry,
      parentEntry,
      relatedEntries,
      includedForms,
    ),
  };
}
