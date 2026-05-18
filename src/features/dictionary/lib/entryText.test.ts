import { describe, expect, it } from "vitest";

import {
  buildEntryDescription,
  getLocalizedGenderedMeanings,
  getLocalizedSenseGroups,
  getLocalizedMeaningValues,
} from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";

const fallbackEntry: LexicalEntry = {
  id: 160394189,
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  senses: [{ grammar: { pos: "N" } }],
  etym: "Egy",
};

describe("entry descriptions", () => {
  it("falls back to product-first wording in English", () => {
    expect(buildEntryDescription(fallbackEntry, "en")).toBe(
      "ϭⲱⲓⲥ (Noun) in the Coptic dictionary on Coptic Compass.",
    );
  });

  it("falls back to product-first wording in Dutch", () => {
    expect(buildEntryDescription(fallbackEntry, "nl")).toBe(
      "ϭⲱⲓⲥ (Zelfstandig naamwoord) in het Koptische woordenboek van Coptic Compass.",
    );
  });

  it("accepts metadata-specific display headings and summaries", () => {
    expect(
      buildEntryDescription(fallbackEntry, "en", {
        displayHeadword: "ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl",
        summary: "m king; f queen; pl royals",
      }),
    ).toBe(
      "ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl (Noun) in the Coptic dictionary. m king; f queen; pl royals.",
    );
  });
});

describe("localized sense groups", () => {
  const groupedVerbEntry: Pick<LexicalEntry, "dialectMeanings" | "senses"> = {
    dialectMeanings: [],
    senses: [
      {
        grammar: { pos: "V", valency: "INTR" },
        meanings: { en: ["intransitive meaning"] },
      },
      {
        grammar: { pos: "V", valency: "TR" },
        meanings: { en: ["transitive meaning"] },
      },
      {
        grammar: { form: "STA", pos: "V" },
        meanings: { en: ["stative meaning"] },
      },
      {
        grammar: { mood: "IMP", pos: "V" },
        meanings: { en: ["imperative meaning"] },
      },
      {
        grammar: { form: "PC", pos: "V" },
        meanings: { en: ["construct participle meaning"] },
      },
    ],
  };

  it("hides form-dependent groups when the active dialect lacks that form", () => {
    expect(
      getLocalizedSenseGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
        hasImperativeForms: true,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP"]);
  });

  it("keeps construct-participle groups when the active dialect has them", () => {
    expect(
      getLocalizedSenseGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          participles: ["ⲧⲁⲓ~"],
          stative: "ⲧⲁⲓ†",
        },
        hasImperativeForms: true,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP", "PC"]);
  });

  it("omits compact source sigla notes from sense labels", () => {
    expect(
      getLocalizedSenseGroups(
        {
          ...groupedVerbEntry,
          senses: [
            {
              grammar: { form: "PC", pos: "V" },
              meanings: { en: ["receiver"] },
              notes: { en: ["BL"] },
            },
          ],
        },
        "en",
        {
          dialectForms: {
            absolute: "ϣⲱⲡ",
            participles: ["ϣⲁⲡ~"],
          },
        },
      ),
    ).toEqual([
      {
        code: "PC",
        meanings: ["receiver"],
        notes: [],
      },
    ]);
  });

  it("carries whole-sense dialect restrictions through sense groups", () => {
    expect(
      getLocalizedSenseGroups({
        ...groupedVerbEntry,
        senses: [
          {
            dialects: ["B", "L"],
            grammar: { form: "PC", pos: "V" },
            meanings: { en: ["receiver"] },
          },
        ],
      }),
    ).toEqual([
      {
        code: "PC",
        dialects: ["B", "L"],
        meanings: ["receiver"],
        notes: [],
      },
    ]);
  });

  it("keeps descriptive notes in sense labels", () => {
    expect(
      getLocalizedSenseGroups({
        ...groupedVerbEntry,
        senses: [
          {
            grammar: { pos: "V", valency: "INTR" },
            meanings: { en: ["be valid"] },
            notes: { en: ["B only"] },
          },
        ],
      }),
    ).toEqual([
      {
        code: "INTR",
        meanings: ["be valid"],
        notes: ["B only"],
      },
    ]);
  });

  it("carries prepositional government through sense groups", () => {
    expect(
      getLocalizedSenseGroups({
        ...groupedVerbEntry,
        senses: [
          {
            grammar: {
              pos: "V",
              prepGovernment: ["ⲉ-", "ⲙⲛ-"],
              valency: "INTR",
            },
            meanings: { en: ["believe"] },
          },
        ],
      }),
    ).toEqual([
      {
        code: "INTR",
        meanings: ["believe"],
        notes: [],
        prepGovernment: ["ⲉ-", "ⲙⲛ-"],
      },
    ]);
  });

  it("carries complementizer government through sense groups", () => {
    expect(
      getLocalizedSenseGroups({
        ...groupedVerbEntry,
        senses: [
          {
            grammar: {
              complementizerGovernment: ["ϫⲉ-", "ϫⲉⲕⲁⲥ"],
              pos: "V",
              valency: "TR",
            },
            meanings: { en: ["ask"] },
          },
        ],
      }),
    ).toEqual([
      {
        code: "TR",
        complementizerGovernment: ["ϫⲉ-", "ϫⲉⲕⲁⲥ"],
        meanings: ["ask"],
        notes: [],
      },
    ]);
  });

  it("carries construction government through sense groups", () => {
    expect(
      getLocalizedSenseGroups({
        ...groupedVerbEntry,
        senses: [
          {
            grammar: {
              constructionGovernment: ["ⲛⲑⲉ ⲛ-", "ⲙⲫⲣⲏϯ ⲛ-", "ⲱⲥ"],
              pos: "V",
              valency: "TR",
            },
            meanings: { en: ["reckon"] },
          },
        ],
      }),
    ).toEqual([
      {
        code: "TR",
        constructionGovernment: ["ⲛⲑⲉ ⲛ-", "ⲙⲫⲣⲏϯ ⲛ-", "ⲱⲥ"],
        meanings: ["reckon"],
        notes: [],
      },
    ]);
  });

  it("attaches structured gendered rows to the noun sense group", () => {
    expect(
      getLocalizedSenseGroups({
        dialectMeanings: [],
        genderedMeanings: [
          {
            meanings: {
              en: {
                f: "queen",
                m: "king",
                pl: "royals",
              },
            },
          },
        ],
        senses: [
          { grammar: { gender: "M", pos: "N" } },
          { grammar: { pos: "ADJ" }, meanings: { en: ["royal"] } },
        ],
      }),
    ).toEqual([
      {
        code: "N",
        genderedRows: [
          {
            values: [
              { marker: "m", meaning: "king" },
              { marker: "f", meaning: "queen" },
              { marker: "pl", meaning: "royals" },
            ],
          },
        ],
        meanings: [],
        notes: [],
      },
      {
        code: "ADJ",
        meanings: ["royal"],
        notes: [],
      },
    ]);
  });

  it("hides imperative groups when the active dialect lacks structured imperatives", () => {
    expect(
      getLocalizedSenseGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
        hasImperativeForms: false,
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA"]);
  });

  it("uses sense groups as the primary gloss source", () => {
    const groupedOnlyEntry: Pick<LexicalEntry, "senses"> = {
      senses: [
        {
          grammar: { pos: "V", valency: "TR" },
          meanings: { en: ["give"], nl: ["geven"] },
        },
      ],
    };

    expect(getLocalizedMeaningValues(groupedOnlyEntry, "en")).toEqual(["give"]);
    expect(getLocalizedMeaningValues(groupedOnlyEntry, "nl")).toEqual([
      "geven",
    ]);
  });
});

describe("localized gendered meanings", () => {
  const genderedEntry: Pick<
    LexicalEntry,
    "dialectMeanings" | "genderedMeanings" | "senses"
  > = {
    dialectMeanings: [],
    genderedMeanings: [
      {
        meanings: {
          en: {
            f: "female slave",
            m: "male slave",
            pl: "slaves",
          },
          nl: {
            f: "vrouwelijke slaaf",
            m: "mannelijke slaaf",
            pl: "slaven",
          },
        },
      },
    ],
    senses: [],
  };

  it("localizes gendered meaning rows without display numbering", () => {
    expect(getLocalizedGenderedMeanings(genderedEntry, "en")).toEqual([
      {
        values: [
          { marker: "m", meaning: "male slave" },
          { marker: "f", meaning: "female slave" },
          { marker: "pl", meaning: "slaves" },
        ],
      },
    ]);
  });

  it("keeps structured gendered rows first in flat meaning values", () => {
    expect(getLocalizedMeaningValues(genderedEntry, "en")[0]).toBe(
      "male slave; female slave; slaves",
    );
  });
});
