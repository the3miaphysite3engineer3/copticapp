import fs from "fs";
import path from "path";

import { cache } from "react";

import {
  prepareDictionaryForSearch,
  searchPreparedDictionaryPage,
  type DictionarySearchPage,
  type DictionarySearchPageOptions,
} from "@/features/dictionary/search";
import type {
  DictionaryClientEntry,
  DictionaryEntryReference,
  DictionaryRelationReference,
  LexicalEntry,
} from "@/features/dictionary/types";
import { assertServerOnly } from "@/lib/server/assertServerOnly.ts";

assertServerOnly("src/features/dictionary/lib/dictionary.ts");

type DictionaryLookupIndex = {
  byId: Map<number, LexicalEntry>;
  entryIds: readonly number[];
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
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as LexicalEntry[];
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
 * repeated id lookups do not require full-array scans.
 */
function getDictionaryLookupIndex(
  dictionary: readonly LexicalEntry[] = getDictionary(),
): DictionaryLookupIndex {
  const cachedIndex = dictionaryLookupIndexCache.get(dictionary);
  if (cachedIndex) {
    return cachedIndex;
  }

  const byId = new Map<number, LexicalEntry>();

  for (const entry of dictionary) {
    byId.set(entry.id, entry);
  }

  const lookupIndex = {
    byId,
    entryIds: dictionary.map((entry) => entry.id),
  } satisfies DictionaryLookupIndex;

  dictionaryLookupIndexCache.set(dictionary, lookupIndex);
  return lookupIndex;
}

function toDictionaryEntryReference(
  entry: LexicalEntry,
): DictionaryEntryReference {
  return {
    dialects: entry.dialects,
    headword: entry.headword,
    id: entry.id,
  };
}

function toDictionaryRelationReference(
  relation: NonNullable<LexicalEntry["relations"]>[number],
  entryLookup?: ReadonlyMap<number, LexicalEntry>,
): DictionaryRelationReference {
  const targetEntry = entryLookup?.get(relation.targetId);

  return {
    ...relation,
    ...(targetEntry
      ? { targetEntry: toDictionaryEntryReference(targetEntry) }
      : {}),
  };
}

/**
 * Keeps client search and analytics views on the smaller transport payload
 * they need instead of shipping entry-detail-only fields.
 */
export function toDictionaryClientEntry(
  entry: LexicalEntry,
  entryLookup?: ReadonlyMap<number, LexicalEntry>,
): DictionaryClientEntry {
  const clientEntry: DictionaryClientEntry = {
    dialects: entry.dialects,
    dialectMeanings: entry.dialectMeanings,
    etym: entry.etym,
    genderedMeanings: entry.genderedMeanings,
    headword: entry.headword,
    id: entry.id,
    inflections: entry.inflections,
    relations: entry.relations?.map((relation) =>
      toDictionaryRelationReference(relation, entryLookup),
    ),
    senses: entry.senses,
  };

  if (entry.greekContext !== undefined) {
    clientEntry.greekContext = entry.greekContext;
  }

  return clientEntry;
}

const readDictionaryClientEntries = cache((): DictionaryClientEntry[] => {
  const dictionary = getDictionary();
  const { byId } = getDictionaryLookupIndex(dictionary);

  return dictionary.map((entry) => toDictionaryClientEntry(entry, byId));
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
 * Returns the cached full dictionary snapshot for server-only features that
 * need entry detail fields beyond the reduced client-search payload.
 */
export function listDictionaryEntries(): LexicalEntry[] {
  return getDictionary();
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
  id: number | string,
  dictionary: readonly LexicalEntry[] = getDictionary(),
) {
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  return getDictionaryLookupIndex(dictionary).byId.get(numericId) ?? null;
}
