import {
  ANALYTICS_DIALECTS,
  type AnalyticsDialect,
} from "@/features/dictionary/config";
import { isVerbPartOfSpeech } from "@/features/dictionary/grammarRegistry";
import type { DictionaryClientEntry } from "@/features/dictionary/types";

type AnalyticsChartDatum = {
  name: string;
  value: number;
};

export type AnalyticsSnapshot = {
  totalRoots: number;
  unknownMeaning: number;
  uncertainMeaning: number;
  posChartData: AnalyticsChartDatum[];
  genderChartData: AnalyticsChartDatum[];
  etymologyChartData: AnalyticsChartDatum[];
  verbCompletenessData: AnalyticsChartDatum[];
  derivationalMorphologyData: AnalyticsChartDatum[];
  relationTypeData: AnalyticsChartDatum[];
  verbalNouns: number;
  totalNouns: number;
  totalMasculine: number;
};

export type EtymologyFilter = "ALL" | "Egy" | "Gr";
export const ETYMOLOGY_FILTERS: EtymologyFilter[] = ["ALL", "Egy", "Gr"];

export type AnalyticsSnapshotMap = Record<
  AnalyticsDialect,
  Record<EtymologyFilter, AnalyticsSnapshot>
>;

/**
 * Reduces one filtered dictionary slice into the chart and summary metrics used
 * by the analytics views.
 */
function createAnalyticsSnapshot(
  dictionary: readonly DictionaryClientEntry[],
): AnalyticsSnapshot {
  const posCounts: Record<string, number> = {
    V: 0,
    N: 0,
    ADJ: 0,
    ADV: 0,
    CONJ: 0,
    PREP: 0,
    INTJ: 0,
    OTHER: 0,
    UNKNOWN: 0,
  };
  const genderCounts = { M: 0, F: 0, BOTH: 0, UNSPECIFIED: 0 };

  let unknownMeaning = 0;
  let uncertainMeaning = 0;

  let egyEtymology = 0;
  let grEtymology = 0;

  let hasStative = 0;
  let missingStative = 0;

  let baseRoots = 0;
  let derivedForms = 0;

  const derivationCounts = {
    abstract: 0,
    agent: 0,
    action: 0,
    privative: 0,
    core: 0,
  };

  for (const entry of dictionary) {
    const meaningString = entry.english_meanings.join(" ").toLowerCase();

    if (meaningString.includes("meaning unknown")) {
      unknownMeaning++;
    }

    if (meaningString.includes("meaning uncertain")) {
      uncertainMeaning++;
    }

    if (entry.etymology === "Gr") {
      grEtymology++;
    } else {
      egyEtymology++;
    }

    if (!entry.relationType) {
      baseRoots++;
    } else {
      derivedForms++;
    }

    if (posCounts[entry.pos] !== undefined) {
      posCounts[entry.pos]++;
    } else {
      posCounts[entry.pos] = 1;
    }

    if (isVerbPartOfSpeech(entry.pos)) {
      const hasAnyStative = Object.values(entry.dialects).some(
        (d) => d?.stative,
      );
      if (hasAnyStative) {
        hasStative++;
      } else {
        missingStative++;
      }
    }

    if (entry.pos === "N") {
      if (entry.gender === "M") {
        genderCounts.M++;
      } else if (entry.gender === "F") {
        genderCounts.F++;
      } else if (entry.gender === "BOTH") {
        genderCounts.BOTH++;
      } else {
        genderCounts.UNSPECIFIED++;
      }

      const hw = entry.headword.toLowerCase();
      if (hw.startsWith("ⲙⲉⲧ") || hw.startsWith("ⲙⲛⲧ")) {
        derivationCounts.abstract++;
      } else if (
        hw.startsWith("ⲣⲉϥ") ||
        hw.startsWith("ⲣⲉⲙ") ||
        hw.startsWith("ⲣⲙ")
      ) {
        derivationCounts.agent++;
      } else if (hw.startsWith("ϫⲓⲛ") || hw.startsWith("ϭⲓⲛ")) {
        derivationCounts.action++;
      } else if (hw.startsWith("ⲁⲧ") || hw.startsWith("ⲁⲑ")) {
        derivationCounts.privative++;
      } else {
        derivationCounts.core++;
      }
    }
  }

  const verbalNouns = posCounts.V || 0;
  const totalNouns = posCounts.N;
  const totalMasculine = genderCounts.M;

  return {
    totalRoots: dictionary.length,
    unknownMeaning,
    uncertainMeaning,
    posChartData: [
      { name: "Verbs", value: posCounts.V },
      { name: "Nouns", value: posCounts.N },
      { name: "Adjectives", value: posCounts.ADJ || 0 },
      { name: "Adverbs", value: posCounts.ADV || 0 },
      { name: "Conjunctions", value: posCounts.CONJ || 0 },
      { name: "Prepositions", value: posCounts.PREP || 0 },
      {
        name: "Other",
        value: (posCounts.OTHER || 0) + (posCounts.INTJ || 0),
      },
    ].filter((item) => item.value > 0),
    genderChartData: [
      { name: "Masculine (explicit)", value: genderCounts.M },
      { name: "Feminine", value: genderCounts.F },
      { name: "Epicene (Both)", value: genderCounts.BOTH },
      { name: "Unspecified", value: genderCounts.UNSPECIFIED },
    ].filter((item) => item.value > 0),
    etymologyChartData: [
      { name: "analytics.egyEtymology", value: egyEtymology },
      { name: "analytics.grEtymology", value: grEtymology },
    ].filter((item) => item.value > 0),
    verbCompletenessData: [
      { name: "analytics.hasStative", value: hasStative },
      { name: "analytics.missingStative", value: missingStative },
    ].filter((item) => item.value > 0),
    derivationalMorphologyData: [
      { name: "analytics.prefixAbstract", value: derivationCounts.abstract },
      { name: "analytics.prefixAgent", value: derivationCounts.agent },
      { name: "analytics.prefixAction", value: derivationCounts.action },
      { name: "analytics.prefixPrivative", value: derivationCounts.privative },
      { name: "analytics.prefixCore", value: derivationCounts.core },
    ].filter((item) => item.value > 0),
    relationTypeData: [
      { name: "analytics.baseRoots", value: baseRoots },
      { name: "analytics.derivedForms", value: derivedForms },
    ].filter((item) => item.value > 0),
    verbalNouns,
    totalNouns,
    totalMasculine,
  };
}

/**
 * Builds analytics snapshots for every dialect and etymology filter
 * combination from the current dictionary dataset.
 */
export function createAnalyticsSnapshots(
  dictionary: readonly DictionaryClientEntry[],
): AnalyticsSnapshotMap {
  return ANALYTICS_DIALECTS.reduce<AnalyticsSnapshotMap>(
    (snapshots, dialect) => {
      snapshots[dialect] = {} as Record<EtymologyFilter, AnalyticsSnapshot>;

      const dialectDictionary =
        dialect === "ALL"
          ? dictionary
          : dictionary.filter((entry) => entry.dialects[dialect] !== undefined);

      for (const etymology of ETYMOLOGY_FILTERS) {
        const filteredDictionary =
          etymology === "ALL"
            ? dialectDictionary
            : dialectDictionary.filter((entry) =>
                etymology === "Gr"
                  ? entry.etymology === "Gr"
                  : entry.etymology !== "Gr",
              );

        snapshots[dialect][etymology] =
          createAnalyticsSnapshot(filteredDictionary);
      }
      return snapshots;
    },
    {} as AnalyticsSnapshotMap,
  );
}
