import { describe, expect, it } from "vitest";

import {
  buildEntryDescription,
  getLocalizedGenderedMeanings,
  getLocalizedMeaningGroups,
  getLocalizedMeaningValues,
  getLocalizedUngroupedMeanings,
} from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";

const fallbackEntry: LexicalEntry = {
  id: "cd_test",
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "",
  english_meanings: [""],
  greek_equivalents: [],
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

describe("localized meaning groups", () => {
  const groupedVerbEntry: Pick<
    LexicalEntry,
    "dialectMeanings" | "dutch_meanings" | "english_meanings" | "meaningGroups"
  > = {
    dialectMeanings: [],
    dutch_meanings: [],
    english_meanings: [],
    meaningGroups: {
      IMP: {
        english_meanings: ["imperative meaning"],
      },
      INTR: {
        english_meanings: ["intransitive meaning"],
      },
      PC: {
        english_meanings: ["construct participle meaning"],
      },
      STA: {
        english_meanings: ["stative meaning"],
      },
      TR: {
        english_meanings: ["transitive meaning"],
      },
    },
  };

  it("hides form-dependent groups when the active dialect lacks that form", () => {
    expect(
      getLocalizedMeaningGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          imperatives: ["ⲙⲟⲓ"],
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP"]);
  });

  it("keeps construct-participle groups when the active dialect has them", () => {
    expect(
      getLocalizedMeaningGroups(groupedVerbEntry, "en", {
        dialectForms: {
          absolute: "ϯ",
          constructParticiples: ["ⲧⲁⲓ~"],
          imperatives: ["ⲙⲁ"],
          stative: "ⲧⲁⲓ†",
        },
      }).map((group) => group.code),
    ).toEqual(["INTR", "TR", "STA", "IMP", "PC"]);
  });

  it("omits compact source sigla notes from meaning group labels", () => {
    expect(
      getLocalizedMeaningGroups(
        {
          ...groupedVerbEntry,
          meaningGroups: {
            PC: {
              english_meanings: ["receiver"],
              english_notes: ["BL"],
            },
          },
        },
        "en",
        {
          dialectForms: {
            absolute: "ϣⲱⲡ",
            constructParticiples: ["ϣⲁⲡ~"],
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

  it("keeps descriptive notes in meaning group labels", () => {
    expect(
      getLocalizedMeaningGroups({
        ...groupedVerbEntry,
        meaningGroups: {
          INTR: {
            english_meanings: ["be valid"],
            english_notes: ["B only"],
          },
        },
      }),
    ).toEqual([
      {
        code: "INTR",
        meanings: ["be valid"],
        notes: ["B only"],
      },
    ]);
  });
});

describe("localized gendered meanings", () => {
  const genderedEntry: Pick<
    LexicalEntry,
    | "dialectMeanings"
    | "dutch_meanings"
    | "english_meanings"
    | "genderedMeanings"
    | "meaningGroups"
  > = {
    dialectMeanings: [],
    dutch_meanings: ["mannelijke slaaf; vrouwelijke slaaf; slaven"],
    english_meanings: ["male slave; female slave; slaves"],
    genderedMeanings: [
      {
        dutch: {
          f: "vrouwelijke slaaf",
          m: "mannelijke slaaf",
          pl: "slaven",
        },
        english: {
          f: "female slave",
          m: "male slave",
          pl: "slaves",
        },
      },
    ],
    meaningGroups: {},
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

  it("does not repeat matching top-level meanings after structured rows", () => {
    expect(getLocalizedUngroupedMeanings(genderedEntry, "en")).toEqual([]);
    expect(getLocalizedMeaningValues(genderedEntry, "en")[0]).toBe(
      "male slave; female slave; slaves",
    );
  });
});
