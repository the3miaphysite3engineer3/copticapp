import type {
  DialectFilter,
  DictionaryPartOfSpeechFilter,
} from "@/features/dictionary/config";
import { entryMatchesPartOfSpeechFilter } from "@/features/dictionary/lib/entryGrammar";
import { getLocalizedMeaningValues } from "@/features/dictionary/lib/entryText";
import type { DictionaryClientEntry } from "@/features/dictionary/types";
import { normalizeCopticSearchText } from "@/lib/copticSearch";

export const DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE = 50;
export const MAX_DICTIONARY_SEARCH_PAGE_SIZE = 100;
export const MAX_DICTIONARY_SEARCH_QUERY_LENGTH = 120;

interface PreparedLexicalEntry {
  englishSearchText: string;
  dutchSearchText: string;
  greekSearchText: string;
  index: number;
  normalizedHeadword: string;
  normalizedDialectForms: string;
  normalizedInflectedForms: string;
}

function getGreekContextSearchValues(entry: DictionaryClientEntry): string[] {
  return [
    ...(entry.greekContext?.sources ?? []),
    ...(entry.greekContext?.equivalents ?? []),
  ];
}

export interface DictionarySearchPageOptions {
  exactMatch?: boolean;
  limit?: number;
  offset?: number;
  query?: string;
  selectedDialect?: DialectFilter;
  selectedPartOfSpeech?: DictionaryPartOfSpeechFilter;
}

export interface DictionarySearchPage {
  entries: DictionaryClientEntry[];
  hasMore: boolean;
  limit: number;
  nextOffset: number | null;
  offset: number;
  totalEntries: number;
  totalMatches: number;
}

type SearchPreparedDictionaryPageArgs = DictionarySearchPageOptions & {
  dictionary: readonly DictionaryClientEntry[];
  preparedDictionary: readonly PreparedLexicalEntry[];
};

function getSearchableDialectFormText(
  dialects: DictionaryClientEntry["dialects"],
) {
  return Object.values(dialects)
    .flatMap((forms) => [
      forms.absolute,
      forms.nominal,
      forms.pronominal,
      forms.stative,
      ...(forms.participles ?? []),
      ...(forms.variants?.absolute ?? []),
      ...(forms.variants?.nominal ?? []),
      ...(forms.variants?.pronominal ?? []),
      ...(forms.variants?.stative ?? []),
      ...(forms.variants?.constructParticiples ?? []),
    ])
    .filter(Boolean)
    .join(" ");
}

function getSearchableInflectedFormText(
  entry: Pick<DictionaryClientEntry, "inflections">,
) {
  if (!entry.inflections) {
    return "";
  }

  const texts: string[] = [];
  const addForms = (forms: unknown) => {
    if (!Array.isArray(forms)) {
      return;
    }

    for (const form of forms) {
      texts.push(typeof form === "string" ? form : form.form);
    }
  };

  for (const dialects of Object.values(entry.inflections)) {
    if (!dialects) {
      continue;
    }

    for (const roles of Object.values(dialects)) {
      if (!roles) {
        continue;
      }

      for (const [role, forms] of Object.entries(roles)) {
        if (
          role === "variants" &&
          forms &&
          typeof forms === "object" &&
          !Array.isArray(forms)
        ) {
          for (const variantForms of Object.values(forms)) {
            addForms(variantForms);
          }
        } else {
          addForms(forms);
        }
      }
    }
  }
  return texts.filter(Boolean).join(" ");
}

/**
 * Precomputes the normalized search fields used by interactive dictionary
 * filtering so repeated queries do not rebuild the same derived strings.
 */
export function prepareDictionaryForSearch(
  dictionary: readonly DictionaryClientEntry[],
): PreparedLexicalEntry[] {
  return dictionary.map((entry, index) => {
    const dialectForms = getSearchableDialectFormText(entry.dialects);
    const inflectedFormsText = getSearchableInflectedFormText(entry);

    return {
      englishSearchText: [...getLocalizedMeaningValues(entry, "en")]
        .join(" ")
        .toLowerCase(),
      dutchSearchText: [...getLocalizedMeaningValues(entry, "nl")]
        .join(" ")
        .toLowerCase(),
      greekSearchText: getGreekContextSearchValues(entry)
        .join(" ")
        .toLowerCase(),
      index,
      normalizedHeadword: normalizeCopticSearchText(entry.headword),
      normalizedDialectForms: normalizeCopticSearchText(dialectForms),
      normalizedInflectedForms: normalizeCopticSearchText(inflectedFormsText),
    };
  });
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Applies the dictionary query, dialect, and part-of-speech filters in a
 * single pass so callers can request only one page of matches at a time.
 */
export function searchPreparedDictionaryPage(
  options: SearchPreparedDictionaryPageArgs,
): DictionarySearchPage {
  const {
    exactMatch = false,
    limit = DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE,
    offset = 0,
    query = "",
    preparedDictionary,
    dictionary,
    selectedDialect = "ALL",
    selectedPartOfSpeech = "ALL",
  } = options;

  const sanitizedLimit = Math.max(1, Math.trunc(limit));
  const sanitizedOffset = Math.max(0, Math.trunc(offset));
  const trimmedQuery = query.trim();
  const plainQuery = trimmedQuery.toLowerCase();
  const normalizedQuery = normalizeCopticSearchText(trimmedQuery);
  const usesQuery = trimmedQuery.length > 0;
  const pageEntries: DictionaryClientEntry[] = [];

  let plainRegex: RegExp | null = null;
  let normalizedRegex: RegExp | null = null;

  if (usesQuery && exactMatch) {
    plainRegex = new RegExp(
      `(^|[^\\p{L}\\p{M}\\p{N}_])${escapeRegExp(plainQuery)}([^\\p{L}\\p{M}\\p{N}_]|$)`,
      "ui",
    );
    normalizedRegex = new RegExp(
      `(^|[^\\p{L}\\p{M}\\p{N}_])${escapeRegExp(normalizedQuery)}([^\\p{L}\\p{M}\\p{N}_]|$)`,
      "ui",
    );
  }

  let totalMatches = 0;

  for (const preparedEntry of preparedDictionary) {
    const entry = dictionary[preparedEntry.index];
    if (!entry) {
      continue;
    }

    if (
      usesQuery &&
      !matchesPreparedEntryQuery(
        preparedEntry,
        exactMatch,
        normalizedQuery,
        plainQuery,
        normalizedRegex,
        plainRegex,
      )
    ) {
      continue;
    }

    if (
      !matchesDictionaryEntryFilters(
        entry,
        selectedDialect,
        selectedPartOfSpeech,
      )
    ) {
      continue;
    }

    if (
      totalMatches >= sanitizedOffset &&
      pageEntries.length < sanitizedLimit
    ) {
      pageEntries.push(entry);
    }

    totalMatches += 1;
  }

  const nextOffset =
    sanitizedOffset + pageEntries.length < totalMatches
      ? sanitizedOffset + pageEntries.length
      : null;

  return {
    entries: pageEntries,
    hasMore: nextOffset !== null,
    limit: sanitizedLimit,
    nextOffset,
    offset: sanitizedOffset,
    totalEntries: dictionary.length,
    totalMatches,
  };
}

function matchesDictionaryEntryFilters(
  entry: DictionaryClientEntry,
  selectedDialect: DialectFilter,
  selectedPartOfSpeech: DictionaryPartOfSpeechFilter,
) {
  if (!entryMatchesPartOfSpeechFilter(entry, selectedPartOfSpeech)) {
    return false;
  }

  if (
    selectedDialect !== "ALL" &&
    entry.dialects[selectedDialect] === undefined &&
    !(
      entry.inflections &&
      Object.values(entry.inflections).some(
        (dialects) => dialects && dialects[selectedDialect] !== undefined,
      )
    )
  ) {
    return false;
  }

  return true;
}

function matchesPreparedEntryQuery(
  entry: PreparedLexicalEntry,
  exactMatch: boolean,
  normalizedQuery: string,
  plainQuery: string,
  normalizedRegex: RegExp | null,
  plainRegex: RegExp | null,
) {
  if (exactMatch && normalizedRegex && plainRegex) {
    if (normalizedRegex.test(entry.normalizedHeadword)) {
      return true;
    }
    if (normalizedRegex.test(entry.normalizedDialectForms)) {
      return true;
    }
    if (
      entry.normalizedInflectedForms &&
      normalizedRegex.test(entry.normalizedInflectedForms)
    ) {
      return true;
    }
    if (plainRegex.test(entry.englishSearchText)) {
      return true;
    }
    if (plainRegex.test(entry.dutchSearchText)) {
      return true;
    }
    if (plainRegex.test(entry.greekSearchText)) {
      return true;
    }
    return false;
  }

  if (entry.normalizedHeadword.includes(normalizedQuery)) {
    return true;
  }
  if (entry.normalizedDialectForms.includes(normalizedQuery)) {
    return true;
  }
  if (
    entry.normalizedInflectedForms &&
    entry.normalizedInflectedForms.includes(normalizedQuery)
  ) {
    return true;
  }
  if (entry.englishSearchText.includes(plainQuery)) {
    return true;
  }
  if (entry.dutchSearchText.includes(plainQuery)) {
    return true;
  }
  if (entry.greekSearchText.includes(plainQuery)) {
    return true;
  }
  return false;
}

/**
 * Searches the prepared index either by substring or whole-token matching
 * across headwords, dialect forms, and translated gloss text.
 */
export function searchPreparedDictionary(
  query: string,
  preparedDictionary: readonly PreparedLexicalEntry[],
  dictionary: readonly DictionaryClientEntry[],
  exactMatch: boolean = false,
): DictionaryClientEntry[] {
  return searchPreparedDictionaryPage({
    dictionary,
    exactMatch,
    limit: dictionary.length || DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE,
    preparedDictionary,
    query,
  }).entries;
}

/**
 * Convenience wrapper that prepares the dictionary and runs a search in one
 * call for places that do not keep a cached prepared index.
 */
function _searchDictionary(
  query: string,
  dictionary: readonly DictionaryClientEntry[],
  exactMatch: boolean = false,
): DictionaryClientEntry[] {
  return searchPreparedDictionary(
    query,
    prepareDictionaryForSearch(dictionary),
    dictionary,
    exactMatch,
  );
}
