import { describe, expect, it } from "vitest";

import type { LexicalEntry } from "@/features/dictionary/types";

import {
  getDictionaryEntryById,
  getDictionaryEntryRelations,
  listDictionaryEntryIds,
  toDictionaryClientEntry,
} from "./dictionary";

function createEntry(
  overrides: Partial<LexicalEntry> & Pick<LexicalEntry, "id" | "headword">,
): LexicalEntry {
  const { id, headword, ...rest } = overrides;
  return {
    id,
    headword,
    dialects: {
      B: {
        absolute: headword,
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    pos: "N",
    gender: "",
    english_meanings: [],
    greek_equivalents: [],
    ...rest,
  };
}

describe("dictionary helpers", () => {
  const dictionary = [
    createEntry({
      id: "cd_20",
      headword: "ϣⲏⲣⲓ",
      english_meanings: ["son"],
    }),
    createEntry({
      id: "cd_20a",
      headword: "ϣⲉⲣⲓ",
      english_meanings: ["daughter"],
      parentEntryId: "cd_20",
      relationType: "feminine-counterpart",
      gender: "F",
    }),
    createEntry({
      id: "cd_493",
      headword: "ⲁⲛⲟⲕ",
      english_meanings: ["I"],
      pos: "OTHER",
    }),
    createEntry({
      id: "cd_493a",
      headword: "ⲛⲑⲟⲥ",
      english_meanings: ["she, it"],
      parentEntryId: "cd_493",
      relationType: "paradigm-member",
      pos: "OTHER",
    }),
    createEntry({
      id: "cd_493b",
      headword: "ⲛⲑⲱⲟⲩ",
      english_meanings: ["they"],
      parentEntryId: "cd_493",
      relationType: "paradigm-member",
      pos: "OTHER",
    }),
  ];

  it("resolves an entry by id from an injected dictionary", () => {
    expect(getDictionaryEntryById("cd_20a", dictionary)?.headword).toBe("ϣⲉⲣⲓ");
    expect(getDictionaryEntryById("missing", dictionary)).toBeNull();
  });

  it("returns the stable ordered list of entry ids for sitemap and params use", () => {
    expect(listDictionaryEntryIds(dictionary)).toEqual([
      "cd_20",
      "cd_20a",
      "cd_493",
      "cd_493a",
      "cd_493b",
    ]);
  });

  it("returns child entries for a base lemma", () => {
    const baseEntry = getDictionaryEntryById("cd_493", dictionary);

    expect(baseEntry).not.toBeNull();
    expect(getDictionaryEntryRelations(baseEntry!, dictionary)).toMatchObject({
      parentEntry: null,
      relatedEntries: [
        { id: "cd_493a", headword: "ⲛⲑⲟⲥ" },
        { id: "cd_493b", headword: "ⲛⲑⲱⲟⲩ" },
      ],
    });
  });

  it("returns the parent entry and siblings for a derived entry", () => {
    const derivedEntry = getDictionaryEntryById("cd_493a", dictionary);

    expect(derivedEntry).not.toBeNull();
    expect(
      getDictionaryEntryRelations(derivedEntry!, dictionary),
    ).toMatchObject({
      parentEntry: { id: "cd_493", headword: "ⲁⲛⲟⲕ" },
      relatedEntries: [{ id: "cd_493b", headword: "ⲛⲑⲱⲟⲩ" }],
    });
  });

  it("builds a reduced client payload with only client-facing dictionary fields", () => {
    expect(toDictionaryClientEntry(dictionary[0]!)).toMatchObject({
      id: "cd_20",
      headword: "ϣⲏⲣⲓ",
      english_meanings: ["son"],
    });
    expect(toDictionaryClientEntry(dictionary[0]!)).not.toHaveProperty(
      "bohairicParadigmData",
    );
    expect(toDictionaryClientEntry(dictionary[0]!)).not.toHaveProperty(
      "greek_equivalents",
    );
  });
});
