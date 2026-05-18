import { describe, expect, it } from "vitest";

import type {
  DictionarySenseGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import { buildEntrySharePayload } from "./entryShare";

type TestEntryOverrides = Partial<LexicalEntry> &
  Pick<LexicalEntry, "id" | "headword"> & {
    grammarGender?: DictionarySenseGrammarGender;
  };

function createEntry(overrides: TestEntryOverrides): LexicalEntry {
  const { grammarGender, id, headword, ...rest } = overrides;
  const senses = rest.senses ?? [
    {
      grammar: grammarGender
        ? { gender: grammarGender, pos: "N" }
        : { pos: "N" },
    },
  ];

  return {
    id,
    headword,
    dialects: {},
    etym: "Egy",
    ...rest,
    senses,
  };
}

describe("entry share helpers", () => {
  it("builds an English share payload with a short gloss", () => {
    const entry = createEntry({
      id: 173,
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
        },
      },
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["N son"] } }],
    });
    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/173",
    });

    expect(payload.title).toBe("ϭⲁϫⲓ ϭⲁϫ | Coptic Dictionary");
    expect(payload.text).toContain("Coptic dictionary entry: ϭⲁϫⲓ ϭⲁϫ");
    expect(payload.text).toContain("son.");
    expect(payload.text).not.toContain("Related forms:");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/en/entry/173",
    );
  });

  it("builds a Dutch share payload with Dutch labels", () => {
    const entry = createEntry({
      id: 200,
      headword: "ⲣⲱⲙⲉ",
      senses: [
        {
          grammar: { pos: "N" },
          meanings: { en: ["man"], nl: ["mens"] },
        },
      ],
    });
    const payload = buildEntrySharePayload({
      entry,
      language: "nl",
      url: "https://www.copticcompass.com/nl/entry/200",
    });

    expect(payload.title).toBe("ⲣⲱⲙⲉ | Koptisch woordenboek");
    expect(payload.text).toContain("Koptisch woordenboeklemma: ⲣⲱⲙⲉ");
    expect(payload.text).toContain("mens.");
    expect(payload.text).not.toContain("Verwante vormen:");
    expect(payload.copyText).toContain(
      "https://www.copticcompass.com/nl/entry/200",
    );
  });

  it("shares gendered headings and all structured gendered gloss rows", () => {
    const entry = createEntry({
      id: 550,
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
      genderedMeanings: [
        {
          meanings: {
            en: {
              f: "female slave",
              m: "male slave",
              pl: "slaves",
            },
          },
        },
        {
          meanings: {
            en: {
              f: "female servant, maidservant",
              m: "male servant",
              pl: "servants",
            },
          },
        },
      ],
      inflections: {
        feminine: {
          B: {
            default: ["ⲃⲱⲕⲓ"],
          },
        },
        plural: {
          B: {
            default: ["ⲉⲃⲓⲁⲓⲕ"],
          },
        },
      },
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/550",
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
      id: 130,
      headword: "ϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲓ",
          nominal: "ϭⲓ-",
          pronominal: "ϭⲓⲧ=",
          stative: "ϭⲏⲟⲩ†",
          participles: ["ϭⲁⲓ~"],
          variants: {
            constructParticiples: ["ϭⲁⲩ~"],
          },
        },
      },
      senses: [
        { grammar: { form: "PC", pos: "V" }, meanings: { en: ["pc taker"] } },
      ],
    });

    const payload = buildEntrySharePayload({
      entry,
      language: "en",
      url: "https://www.copticcompass.com/en/entry/130",
    });

    expect(payload.title).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~ | Coptic Dictionary");
    expect(payload.text).toContain(
      "Coptic dictionary entry: ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
  });
});
