import { describe, expect, it } from "vitest";

import type { LexicalEntry } from "@/features/dictionary/types";

import { buildEntrySharePayload } from "./entryShare";

function createEntry(
  overrides: Partial<LexicalEntry> & Pick<LexicalEntry, "id" | "headword">,
): LexicalEntry {
  const { id, headword, ...rest } = overrides;

  return {
    id,
    headword,
    dialects: {},
    pos: "N",
    gender: "",
    english_meanings: [],
    greek_equivalents: [],
    ...rest,
  };
}

describe("entry share helpers", () => {
  it("builds an English share payload with a short gloss and related forms", () => {
    const entry = createEntry({
      id: "cd_173",
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
        },
      },
      english_meanings: ["N son"],
    });
    const parentEntry = createEntry({
      id: "cd_100",
      headword: "ⲥⲁϫ",
      english_meanings: ["root"],
    });
    const relatedEntries = [
      createEntry({
        id: "cd_174",
        headword: "ⲥⲁϫⲉ",
        english_meanings: ["daughter"],
      }),
      createEntry({
        id: "cd_175",
        headword: "ⲥⲁϫⲟ",
        english_meanings: ["speech"],
      }),
    ] as const;

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      parentEntry,
      relatedEntries,
      url: "https://www.copticcompass.com/en/entry/cd_173",
    });

    expect(payload.title).toBe("ϭⲁϫⲓ ϭⲁϫ | Coptic Dictionary");
    expect(payload.text).toContain("Coptic dictionary entry: ϭⲁϫⲓ ϭⲁϫ");
    expect(payload.text).toContain("son.");
    expect(payload.text).toContain("Related forms: ⲥⲁϫ • ⲥⲁϫⲉ");
    expect(payload.text).not.toContain("ⲥⲁϫⲟ");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/en/entry/cd_173",
    );
  });

  it("builds a Dutch share payload with Dutch labels", () => {
    const entry = createEntry({
      id: "cd_200",
      headword: "ⲣⲱⲙⲉ",
      english_meanings: ["man"],
      dutch_meanings: ["mens"],
    });
    const relatedEntry = createEntry({
      id: "cd_201",
      headword: "ⲣⲱⲙⲉ",
      dialects: {
        B: {
          absolute: "ⲣⲱⲙⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
      dutch_meanings: ["menselijk"],
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "nl",
      relatedEntries: [relatedEntry],
      url: "https://www.copticcompass.com/nl/entry/cd_200",
    });

    expect(payload.title).toBe("ⲣⲱⲙⲉ | Koptisch woordenboek");
    expect(payload.text).toContain("Koptisch woordenboeklemma: ⲣⲱⲙⲉ");
    expect(payload.text).toContain("mens.");
    expect(payload.text).toContain("Verwante vormen: ⲣⲱⲙⲓ");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/nl/entry/cd_200",
    );
  });

  it("shares gendered headings and all structured gendered gloss rows", () => {
    const entry = createEntry({
      id: "cd_550",
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      english_meanings: [
        "male slave; female slave; slaves",
        "male servant; female servant, maidservant; servants",
      ],
      gender: "M",
      genderedMeanings: [
        {
          english: {
            f: "female slave",
            m: "male slave",
            pl: "slaves",
          },
        },
        {
          english: {
            f: "female servant, maidservant",
            m: "male servant",
            pl: "servants",
          },
        },
      ],
      pluralForms: {
        B: ["ⲉⲃⲓⲁⲓⲕ"],
      },
    });
    const feminineCounterpart = createEntry({
      id: "cd_550a",
      headword: "ⲃⲱⲕⲓ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕⲓ",
        },
      },
      english_meanings: ["female slave", "female servant, maidservant"],
      gender: "F",
      parentEntryId: "cd_550",
      relationType: "feminine-counterpart",
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      relatedEntries: [feminineCounterpart],
      url: "https://www.copticcompass.com/en/entry/cd_550",
    });

    expect(payload.title).toBe("ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl | Coptic Dictionary");
    expect(payload.text).toContain(
      "Coptic dictionary entry: ⲃⲱⲕ m ⲃⲱⲕⲓ f ⲉⲃⲓⲁⲓⲕ pl",
    );
    expect(payload.text).toContain(
      "m male slave; f female slave; pl slaves; m male servant; f female servant, maidservant; pl servants.",
    );
    expect(payload.text).not.toContain("Related forms: ⲃⲱⲕⲓ");
  });

  it("includes the primary construct participle in share headings", () => {
    const entry = createEntry({
      id: "cd_130",
      headword: "ϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲓ",
          nominal: "ϭⲓ-",
          pronominal: "ϭⲓⲧ=",
          stative: "ϭⲏⲟⲩ†",
          constructParticiples: ["ϭⲁⲓ~"],
          variants: {
            constructParticiples: ["ϭⲁⲩ~"],
          },
        },
      },
      english_meanings: ["pc taker"],
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/cd_130",
    });

    expect(payload.title).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~ | Coptic Dictionary");
    expect(payload.text).toContain(
      "Coptic dictionary entry: ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
  });
});
