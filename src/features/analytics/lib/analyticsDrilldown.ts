import type { EtymologyFilter } from "@/features/analytics/lib/analytics";
import type { AnalyticsDialect } from "@/features/dictionary/config";
import { isVerbPartOfSpeech } from "@/features/dictionary/grammarRegistry";
import {
  DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE,
  MAX_DICTIONARY_SEARCH_PAGE_SIZE,
} from "@/features/dictionary/search";
import type { DictionaryClientEntry } from "@/features/dictionary/types";

export type AnalyticsStatDrilldownType = "total" | "uncertain" | "unknown";
export type AnalyticsChartDrilldownType =
  | "derivation"
  | "etymology"
  | "gender"
  | "pos"
  | "relations"
  | "verb";

export type AnalyticsDrilldown =
  | {
      kind: "stat";
      title: string;
      type: AnalyticsStatDrilldownType;
    }
  | {
      chartType: AnalyticsChartDrilldownType;
      kind: "chart";
      originalName: string;
      title: string;
    };

export interface AnalyticsDrilldownPage {
  entries: DictionaryClientEntry[];
  hasMore: boolean;
  limit: number;
  nextOffset: number | null;
  offset: number;
  totalEntries: number;
  totalMatches: number;
}

/**
 * Builds the serializable drilldown descriptor for top-level total,
 * unknown-meaning, and uncertain-meaning analytics stats.
 */
export function buildAnalyticsStatDrilldown(options: {
  type: AnalyticsStatDrilldownType;
  totalTitle: string;
  uncertainTitle: string;
  unknownTitle: string;
}): AnalyticsDrilldown {
  if (options.type === "total") {
    return {
      kind: "stat",
      title: options.totalTitle,
      type: "total",
    };
  }

  if (options.type === "unknown") {
    return {
      kind: "stat",
      title: options.unknownTitle,
      type: "unknown",
    };
  }

  return {
    kind: "stat",
    title: options.uncertainTitle,
    type: "uncertain",
  };
}

/**
 * Builds the serializable drilldown descriptor for chart segments such as
 * part of speech, gender, etymology, derivation, verb completeness, and
 * relation type.
 */
export function buildAnalyticsChartDrilldown(options: {
  originalName: string;
  title: string;
  type: AnalyticsChartDrilldownType;
}): AnalyticsDrilldown {
  return {
    chartType: options.type,
    kind: "chart",
    originalName: options.originalName,
    title: options.title,
  };
}

/**
 * Applies the selected dialect, etymology, and drilldown descriptor to the
 * dictionary dataset for analytics slide-over result lists.
 */
function _filterAnalyticsEntries(options: {
  dictionary: readonly DictionaryClientEntry[];
  drilldown: AnalyticsDrilldown | null;
  selectedDialect: AnalyticsDialect;
  selectedEtymology: EtymologyFilter;
}) {
  if (!options.drilldown) {
    return [];
  }

  const activeDrilldown = options.drilldown;

  return options.dictionary.filter(
    (entry) =>
      matchesAnalyticsEntryFilters(
        entry,
        options.selectedDialect,
        options.selectedEtymology,
      ) && matchesAnalyticsDrilldownEntry(entry, activeDrilldown),
  );
}

/**
 * Returns one page of analytics drilldown results so the slide-over can fetch
 * matching dictionary entries incrementally instead of loading the full index.
 */
export function getAnalyticsDrilldownPage(options: {
  dictionary: readonly DictionaryClientEntry[];
  drilldown: AnalyticsDrilldown;
  limit?: number;
  offset?: number;
  selectedDialect: AnalyticsDialect;
  selectedEtymology: EtymologyFilter;
}): AnalyticsDrilldownPage {
  const limit = Math.max(
    1,
    Math.min(
      Math.trunc(options.limit ?? DEFAULT_DICTIONARY_SEARCH_PAGE_SIZE),
      MAX_DICTIONARY_SEARCH_PAGE_SIZE,
    ),
  );
  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const pageEntries: DictionaryClientEntry[] = [];
  let totalMatches = 0;

  for (const entry of options.dictionary) {
    if (
      !matchesAnalyticsEntryFilters(
        entry,
        options.selectedDialect,
        options.selectedEtymology,
      )
    ) {
      continue;
    }

    if (!matchesAnalyticsDrilldownEntry(entry, options.drilldown)) {
      continue;
    }

    if (totalMatches >= offset && pageEntries.length < limit) {
      pageEntries.push(entry);
    }

    totalMatches += 1;
  }

  const nextOffset =
    offset + pageEntries.length < totalMatches
      ? offset + pageEntries.length
      : null;

  return {
    entries: pageEntries,
    hasMore: nextOffset !== null,
    limit,
    nextOffset,
    offset,
    totalEntries: options.dictionary.length,
    totalMatches,
  };
}

/**
 * Applies the serializable drilldown descriptor to one dictionary entry.
 */
function matchesAnalyticsDrilldownEntry(
  entry: DictionaryClientEntry,
  drilldown: AnalyticsDrilldown,
) {
  if (drilldown.kind === "stat") {
    if (drilldown.type === "total") {
      return true;
    }

    const meaningString = entry.english_meanings.join(" ").toLowerCase();
    return drilldown.type === "unknown"
      ? meaningString.includes("meaning unknown")
      : meaningString.includes("meaning uncertain");
  }

  if (drilldown.chartType === "pos") {
    if (drilldown.originalName === "Verbs") {
      return isVerbPartOfSpeech(entry.pos);
    }
    if (drilldown.originalName === "Nouns") {
      return entry.pos === "N";
    }
    if (drilldown.originalName === "Adjectives") {
      return entry.pos === "ADJ";
    }
    if (drilldown.originalName === "Adverbs") {
      return entry.pos === "ADV";
    }
    if (drilldown.originalName === "Conjunctions") {
      return entry.pos === "CONJ";
    }
    if (drilldown.originalName === "Prepositions") {
      return entry.pos === "PREP";
    }

    return (
      entry.pos === "OTHER" || entry.pos === "INTJ" || entry.pos === "UNKNOWN"
    );
  }

  if (drilldown.chartType === "gender") {
    if (entry.pos !== "N") {
      return false;
    }
    if (drilldown.originalName.startsWith("Masculine")) {
      return entry.gender === "M";
    }
    if (drilldown.originalName.startsWith("Feminine")) {
      return entry.gender === "F";
    }
    if (drilldown.originalName.startsWith("Epicene")) {
      return entry.gender === "BOTH";
    }
    return entry.gender === "";
  }

  if (drilldown.chartType === "etymology") {
    return drilldown.originalName === "analytics.grEtymology"
      ? entry.etymology === "Gr"
      : entry.etymology !== "Gr";
  }

  if (drilldown.chartType === "derivation") {
    if (entry.pos !== "N") {
      return false;
    }

    const headword = entry.headword.toLowerCase();
    if (drilldown.originalName === "analytics.prefixAbstract") {
      return headword.startsWith("ⲙⲉⲧ") || headword.startsWith("ⲙⲛⲧ");
    }
    if (drilldown.originalName === "analytics.prefixAgent") {
      return (
        headword.startsWith("ⲣⲉϥ") ||
        headword.startsWith("ⲣⲉⲙ") ||
        headword.startsWith("ⲣⲙ")
      );
    }
    if (drilldown.originalName === "analytics.prefixAction") {
      return headword.startsWith("ϫⲓⲛ") || headword.startsWith("ϭⲓⲛ");
    }
    if (drilldown.originalName === "analytics.prefixPrivative") {
      return headword.startsWith("ⲁⲧ") || headword.startsWith("ⲁⲑ");
    }

    return !(
      headword.startsWith("ⲙⲉⲧ") ||
      headword.startsWith("ⲙⲛⲧ") ||
      headword.startsWith("ⲣⲉϥ") ||
      headword.startsWith("ⲣⲉⲙ") ||
      headword.startsWith("ⲣⲙ") ||
      headword.startsWith("ϫⲓⲛ") ||
      headword.startsWith("ϭⲓⲛ") ||
      headword.startsWith("ⲁⲧ") ||
      headword.startsWith("ⲁⲑ")
    );
  }

  if (drilldown.chartType === "verb") {
    if (!isVerbPartOfSpeech(entry.pos)) {
      return false;
    }

    const hasAnyStative = Object.values(entry.dialects).some(
      (dialect) => dialect?.stative,
    );

    return drilldown.originalName === "analytics.hasStative"
      ? hasAnyStative
      : !hasAnyStative;
  }

  return drilldown.originalName === "analytics.baseRoots"
    ? !entry.relationType
    : Boolean(entry.relationType);
}

function matchesAnalyticsEntryFilters(
  entry: DictionaryClientEntry,
  selectedDialect: AnalyticsDialect,
  selectedEtymology: EtymologyFilter,
) {
  if (
    selectedDialect !== "ALL" &&
    entry.dialects[selectedDialect] === undefined
  ) {
    return false;
  }

  if (selectedEtymology === "ALL") {
    return true;
  }

  return selectedEtymology === "Gr"
    ? entry.etymology === "Gr"
    : entry.etymology !== "Gr";
}
