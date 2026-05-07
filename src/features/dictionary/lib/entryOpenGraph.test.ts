import { describe, expect, it } from "vitest";

import type { LexicalEntry } from "@/features/dictionary/types";

import {
  buildEntryOpenGraphImageUrl,
  buildEntryOpenGraphPreview,
} from "./entryOpenGraph";

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

describe("entry Open Graph helpers", () => {
  it("builds a stable entry-specific Open Graph image URL", () => {
    expect(
      buildEntryOpenGraphImageUrl("cd_173", "nl", "https://example.com"),
    ).toBe("https://example.com/api/og?type=entry&locale=nl&id=cd_173");
  });

  it("builds a preview with gloss and capped related forms", () => {
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

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
      parentEntry: createEntry({
        id: "cd_100",
        headword: "ⲥⲁϫ",
      }),
      relatedEntries: [
        createEntry({
          id: "cd_174",
          headword: "ⲥⲁϫⲉ",
        }),
        createEntry({
          id: "cd_175",
          headword: "ⲥⲁϫⲟ",
        }),
      ],
    });

    expect(preview.heading).toBe("ϭⲁϫⲓ ϭⲁϫ");
    expect(preview.gloss).toBe("son");
    expect(preview.relatedForms).toEqual(["ⲥⲁϫ", "ⲥⲁϫⲉ"]);
    expect(preview.strapline).toBe("Coptic Dictionary");
  });

  it("includes the primary construct participle in preview headings", () => {
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

    const preview = buildEntryOpenGraphPreview({
      entry,
      language: "en",
    });

    expect(preview.heading).toBe("ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~");
  });
});
