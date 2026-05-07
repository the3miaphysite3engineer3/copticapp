import fs from "fs";
import path from "path";

import { cache } from "react";

import { normalizePartOfSpeech } from "@/features/dictionary/config";
import {
  prepareDictionaryForSearch,
  searchPreparedDictionaryPage,
  type DictionarySearchPage,
  type DictionarySearchPageOptions,
} from "@/features/dictionary/search";
import type {
  DictionaryClientEntry,
  LexicalEntry,
} from "@/features/dictionary/types";
import { assertServerOnly } from "@/lib/server/assertServerOnly.ts";

assertServerOnly("src/features/dictionary/lib/dictionary.ts");

type DictionaryLookupIndex = {
  byId: Map<string, LexicalEntry>;
  childIdsByParentId: Map<string, readonly string[]>;
  entryIds: readonly string[];
};

const dictionaryLookupIndexCache = new WeakMap<
  readonly LexicalEntry[],
  DictionaryLookupIndex
>();

/**
 * Reads the generated dictionary snapshot from the public data bundle and
 * memoizes it for the lifetime of the server process.
 */
const readDictionary = cache((): LexicalEntry[] => {
  const filePath = path.join(process.cwd(), "public/data/dictionary.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return (JSON.parse(fs.readFileSync(filePath, "utf8")) as LexicalEntry[]).map(
    (entry) => ({
      ...entry,
      pos: normalizePartOfSpeech(entry.pos),
    }),
  );
});

/**
 * Returns the cached dictionary snapshot used by server routes and metadata
 * helpers that need dictionary access without a database round trip.
 */
function getDictionary(): LexicalEntry[] {
  return readDictionary();
}

/**
 * Builds the cached lookup maps used by server-only dictionary consumers so
 * repeated id and relation lookups do not require full-array scans.
 */
function getDictionaryLookupIndex(
  dictionary: readonly LexicalEntry[] = getDictionary(),
): DictionaryLookupIndex {
  const cachedIndex = dictionaryLookupIndexCache.get(dictionary);
  if (cachedIndex) {
    return cachedIndex;
  }

  const byId = new Map<string, LexicalEntry>();
  const mutableChildIdsByParentId = new Map<string, string[]>();

  for (const entry of dictionary) {
    byId.set(entry.id, entry);

    if (!entry.parentEntryId) {
      continue;
    }

    const childIds = mutableChildIdsByParentId.get(entry.parentEntryId) ?? [];
    childIds.push(entry.id);
    mutableChildIdsByParentId.set(entry.parentEntryId, childIds);
  }

  const childIdsByParentId = new Map<string, readonly string[]>(
    [...mutableChildIdsByParentId.entries()].map(([parentId, childIds]) => [
      parentId,
      [...childIds].sort((leftId, rightId) => {
        const leftEntry = byId.get(leftId);
        const rightEntry = byId.get(rightId);

        return (leftEntry?.headword ?? "").localeCompare(
          rightEntry?.headword ?? "",
        );
      }),
    ]),
  );
  const lookupIndex = {
    byId,
    childIdsByParentId,
    entryIds: dictionary.map((entry) => entry.id),
  } satisfies DictionaryLookupIndex;

  dictionaryLookupIndexCache.set(dictionary, lookupIndex);
  return lookupIndex;
}

/**
 * Keeps client search and analytics views on the smaller transport payload
 * they need instead of shipping entry-detail-only fields.
 */
export function toDictionaryClientEntry(
  entry: LexicalEntry,
): DictionaryClientEntry {
  const clientEntry: DictionaryClientEntry = {
    dialects: entry.dialects,
    dutch_meanings: entry.dutch_meanings,
    english_meanings: entry.english_meanings,
    etymology: entry.etymology,
    gender: entry.gender,
    headword: entry.headword,
    id: entry.id,
    pluralForms: entry.pluralForms,
    pos: entry.pos,
    relationType: entry.relationType,
  };

  if (entry.greek_equivalents.length > 0) {
    clientEntry.greek_equivalents = entry.greek_equivalents;
  }

  return clientEntry;
}

const readDictionaryClientEntries = cache((): DictionaryClientEntry[] => {
  return getDictionary().map(toDictionaryClientEntry);
});

const readPreparedDictionarySearchEntries = cache(() => {
  return prepareDictionaryForSearch(getDictionaryClientEntries());
});

/**
 * Returns the cached reduced dictionary payload used by client search and
 * analytics drilldowns.
 */
export function getDictionaryClientEntries(): DictionaryClientEntry[] {
  return readDictionaryClientEntries();
}

/**
 * Returns the cached ordered list of dictionary entry ids used by sitemap and
 * static-param generation without requiring callers to keep the full entry
 * objects in memory.
 */
export function listDictionaryEntryIds(
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  return getDictionaryLookupIndex(dictionary).entryIds;
}

/**
 * Runs paginated dictionary search against the cached reduced dictionary
 * snapshot so public routes can stream only the current result page.
 */
export function getDictionarySearchPage(
  options: DictionarySearchPageOptions,
): DictionarySearchPage {
  return searchPreparedDictionaryPage({
    dictionary: getDictionaryClientEntries(),
    preparedDictionary: readPreparedDictionarySearchEntries(),
    ...options,
  });
}

/**
 * Resolves one entry by id from a provided dictionary snapshot, defaulting to
 * the cached JSON export when callers do not already have a list in memory.
 */
export function getDictionaryEntryById(
  id: string,
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  return getDictionaryLookupIndex(dictionary).byId.get(id) ?? null;
}

/**
 * Resolves the parent and directly related entries for a dictionary item. Child
 * entries return siblings under the same parent, while parent entries return
 * their attached descendants.
 */
export function getDictionaryEntryRelations(
  entry: LexicalEntry,
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  const dictionaryLookupIndex = getDictionaryLookupIndex(dictionary);
  const parentEntry = entry.parentEntryId
    ? (dictionaryLookupIndex.byId.get(entry.parentEntryId) ?? null)
    : null;
  const relatedEntryIds = entry.parentEntryId
    ? (
        dictionaryLookupIndex.childIdsByParentId.get(entry.parentEntryId) ?? []
      ).filter((candidateId) => candidateId !== entry.id)
    : (dictionaryLookupIndex.childIdsByParentId.get(entry.id) ?? []);
  const relatedEntries = relatedEntryIds
    .map((relatedEntryId) => dictionaryLookupIndex.byId.get(relatedEntryId))
    .filter((candidate): candidate is LexicalEntry => candidate !== undefined);

  return {
    parentEntry,
    relatedEntries,
  };
}
