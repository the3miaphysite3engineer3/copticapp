import { describe, expect, it } from "vitest";

import type {
  DictionarySenseGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  buildEntryOpenGraphImageUrl,
  buildEntryOpenGraphPreview,
} from "./entryOpenGraph";

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

describe("entry Open Graph helpers", () => {
  it("builds a stable entry-specific Open Graph image URL", () => {
    expect(buildEntryOpenGraphImageUrl(173, "nl", "https://example.com")).toBe(
      "https://example.com/api/og?type=entry&locale=nl&id=173",
    );
  });

  it("builds a preview with gloss", () => {
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

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ϭⲁϫⲓ ϭⲁϫ");
    expect(preview.gloss).toBe("son");
    expect(preview.strapline).toBe("Coptic Dictionary");
  });

  it("uses gendered heading and gloss data for social previews", () => {
    const entry = createEntry({
      id: 18,
      headword: "ⲣⲣⲟ",
      dialects: {
        B: {
          absolute: "ⲟⲩⲣⲟ",
        },
      },
      senses: [
        { grammar: { gender: "M", pos: "N" } },
        { grammar: { pos: "ADJ" }, meanings: { en: ["royal"] } },
      ],
      grammarGender: "M",
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
      inflections: {
        feminine: {
          B: {
            default: ["ⲟⲩⲣⲱ"],
          },
        },
        plural: {
          B: {
            default: ["ⲟⲩⲣⲱⲟⲩ"],
          },
        },
      },
    });

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ⲟⲩⲣⲟ m ⲟⲩⲣⲱ f ⲟⲩⲣⲱⲟⲩ pl");
    expect(preview.headingParts).toEqual([
      { marker: "m", spelling: "ⲟⲩⲣⲟ" },
      { marker: "f", spelling: "ⲟⲩⲣⲱ" },
      { marker: "pl", spelling: "ⲟⲩⲣⲱⲟⲩ" },
    ]);
    expect(preview.gloss).toBe("m king; f queen; pl royals");
    expect(preview.genderedGlossRows).toEqual([
      {
        values: [
          { marker: "m", meaning: "king" },
          { marker: "f", meaning: "queen" },
          { marker: "pl", meaning: "royals" },
        ],
      },
    ]);
  });

  it("includes the primary construct participle in preview headings", () => {
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

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~");
  });
});
