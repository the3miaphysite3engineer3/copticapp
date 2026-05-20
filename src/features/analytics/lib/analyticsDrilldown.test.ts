import { describe, expect, it } from "vitest";

import {
  buildAnalyticsChartDrilldown,
  buildAnalyticsStatDrilldown,
  getAnalyticsDrilldownPage,
} from "@/features/analytics/lib/analyticsDrilldown";
import type { DictionaryClientEntry } from "@/features/dictionary/types";

const dictionary: DictionaryClientEntry[] = [
  {
    dialects: {
      B: {
        absolute: "ϭⲱⲓⲥ",
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    etym: "Egy",
    headword: "ϭⲱⲓⲥ",
    id: 17,
    senses: [{ grammar: { pos: "N" }, meanings: { en: ["lord"] } }],
  },
  {
    dialects: {
      B: {
        absolute: "ⲉⲓⲱⲧ",
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    etym: "Gr",
    headword: "ⲉⲓⲱⲧ",
    id: 18,
    senses: [
      {
        grammar: { gender: "M", pos: "N" },
        meanings: { en: ["meaning unknown"] },
      },
    ],
  },
  {
    dialects: {
      S: {
        absolute: "ⲃⲱⲕ",
        nominal: "",
        pronominal: "",
        stative: "ⲃⲏⲕ",
      },
    },
    etym: "Egy",
    headword: "ⲃⲱⲕ",
    id: 19,
    senses: [{ grammar: { pos: "V" }, meanings: { en: ["run"] } }],
  },
  {
    dialects: {
      M: {
        absolute: "ϯϫⲣⲉ ⲛϩⲏⲧ",
      },
    },
    etym: "Unknown",
    headword: "ϯϫⲣⲉ ⲛϩⲏⲧ",
    id: 7348,
    senses: [
      { grammar: { pos: "V" }, meanings: { en: ["encourage, console"] } },
    ],
  },
];

describe("analytics drilldown", () => {
  it("pages stat drilldowns after dialect and etymology filters", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsStatDrilldown({
        totalTitle: "All entries",
        type: "total",
        uncertainTitle: "Meaning uncertain",
        unknownTitle: "Meaning unknown",
      }),
      limit: 1,
      offset: 0,
      selectedDialect: "B",
      selectedEtymology: "Gr",
    });

    expect(page).toMatchObject({
      entries: [{ id: 18 }],
      hasMore: false,
      totalEntries: 4,
      totalMatches: 1,
    });
  });

  it("matches explicit unknown etymology filters and chart slices", () => {
    const filteredPage = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsStatDrilldown({
        totalTitle: "All entries",
        type: "total",
        uncertainTitle: "Meaning uncertain",
        unknownTitle: "Meaning unknown",
      }),
      selectedDialect: "ALL",
      selectedEtymology: "Unknown",
    });
    const chartPage = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "analytics.unknownEtymology",
        title: "Unknown etymology",
        type: "etymology",
      }),
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(filteredPage).toMatchObject({
      entries: [{ id: 7348 }],
      totalMatches: 1,
    });
    expect(chartPage).toMatchObject({
      entries: [{ id: 7348 }],
      totalMatches: 1,
    });
  });

  it("matches chart drilldowns with paginated results", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary,
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "Nouns",
        title: "Nouns",
        type: "pos",
      }),
      limit: 1,
      offset: 1,
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(page).toMatchObject({
      entries: [{ id: 18 }],
      hasMore: false,
      nextOffset: null,
      totalMatches: 2,
    });
  });

  it("matches part-of-speech chart drilldowns through meaning-group grammar", () => {
    const page = getAnalyticsDrilldownPage({
      dictionary: [
        {
          dialects: {
            B: {
              absolute: "ⲉⲛⲉϩ",
            },
          },
          headword: "ⲉⲛⲉϩ",
          etym: "Egy",
          id: 2639070627,
          senses: [
            {
              grammar: {
                gender: "M",
                pos: "N",
              },
              meanings: { en: ["eternity"] },
            },
            {
              grammar: {
                pos: "ADJ",
              },
              meanings: { en: ["eternal"] },
            },
          ],
        },
      ],
      drilldown: buildAnalyticsChartDrilldown({
        originalName: "Adjectives",
        title: "Adjectives",
        type: "pos",
      }),
      limit: 10,
      offset: 0,
      selectedDialect: "ALL",
      selectedEtymology: "ALL",
    });

    expect(page).toMatchObject({
      entries: [{ id: 2639070627 }],
      totalMatches: 1,
    });
  });
});
