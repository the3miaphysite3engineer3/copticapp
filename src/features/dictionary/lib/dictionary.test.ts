import { describe, expect, it } from "vitest";

import type {
  DictionarySenseGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  getDictionaryEntryById,
  listDictionaryEntryIds,
  toDictionaryClientEntry,
} from "./dictionary";

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
    dialects: {
      B: {
        absolute: headword,
        nominal: "",
        pronominal: "",
        stative: "",
      },
    },
    etym: "Egy",
    ...rest,
    senses,
  };
}

describe("dictionary helpers", () => {
  const dictionary = [
    createEntry({
      id: 20,
      headword: "ϣⲏⲣⲓ",
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["son"] } }],
      inflections: {
        feminine: {
          B: {
            default: ["ϣⲉⲣⲓ"],
          },
        },
      },
    }),
    createEntry({
      id: 493,
      headword: "ⲁⲛⲟⲕ",
      senses: [{ grammar: { pos: "OTHER" }, meanings: { en: ["I"] } }],
    }),
    createEntry({
      id: 2639720405,
      headword: "ⲛⲑⲟⲥ",
      senses: [{ grammar: { pos: "OTHER" }, meanings: { en: ["she, it"] } }],
    }),
    createEntry({
      id: 3142450453,
      headword: "ⲛⲑⲱⲟⲩ",
      senses: [{ grammar: { pos: "OTHER" }, meanings: { en: ["they"] } }],
    }),
  ];

  it("resolves an entry by id from an injected dictionary", () => {
    expect(getDictionaryEntryById("20", dictionary)?.headword).toBe("ϣⲏⲣⲓ");
    expect(getDictionaryEntryById("missing", dictionary)).toBeNull();
  });

  it("returns the stable ordered list of entry ids for sitemap and params use", () => {
    expect(listDictionaryEntryIds(dictionary)).toEqual([
      20, 493, 2639720405, 3142450453,
    ]);
  });

  it("builds a reduced client payload with only client-facing dictionary fields", () => {
    const clientEntry = toDictionaryClientEntry(dictionary[0]!);

    expect(clientEntry).toMatchObject({
      id: 20,
      headword: "ϣⲏⲣⲓ",
      senses: [{ meanings: { en: ["son"] } }],
    });
    expect(Object.keys(clientEntry).sort()).toEqual(
      [
        "dialectMeanings",
        "dialects",
        "etym",
        "genderedMeanings",
        "headword",
        "id",
        "inflections",
        "relations",
        "senses",
      ].sort(),
    );
  });

  it("keeps structured inflected forms in the reduced client payload for search", () => {
    const pluralOnlyEntry = createEntry({
      id: 1066624037,
      headword: "ϩⲁϩ",
      dialects: {},
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["many, much"] } }],
      inflections: {
        plural: {
          S: {
            default: ["ϩⲁϩ"],
          },
        },
      },
    });

    expect(getDictionaryEntryById(1066624037, [pluralOnlyEntry])).toMatchObject(
      {
        id: 1066624037,
        inflections: { plural: { S: { default: ["ϩⲁϩ"] } } },
      },
    );
    expect(toDictionaryClientEntry(pluralOnlyEntry)).toMatchObject({
      id: 1066624037,
      inflections: { plural: { S: { default: ["ϩⲁϩ"] } } },
    });
  });

  it("adds a compact target reference for compound relation entries", () => {
    const targetEntry = createEntry({
      id: 2,
      headword: "ϯ",
      senses: [{ grammar: { pos: "V" }, meanings: { en: ["give"] } }],
    });
    const compoundEntry = createEntry({
      id: 11146,
      headword: "ⲧⲁⲓ̈ⲟⲩⲧⲁϩ",
      relations: [
        {
          targetId: targetEntry.id,
          type: "COMPOUND_WITH",
        },
      ],
      senses: [
        {
          grammar: { gender: "BOTH", pos: "N" },
          meanings: { en: ["fruit-bearer"] },
        },
      ],
    });

    expect(
      toDictionaryClientEntry(
        compoundEntry,
        new Map([[targetEntry.id, targetEntry]]),
      ),
    ).toMatchObject({
      id: 11146,
      relations: [
        {
          targetEntry: {
            headword: "ϯ",
            id: 2,
          },
          targetId: 2,
          type: "COMPOUND_WITH",
        },
      ],
    });
  });

  it("adds compact target references for relation client entries", () => {
    const targetEntry = createEntry({
      id: 13,
      headword: "ϣⲱⲡⲉ",
      senses: [{ grammar: { pos: "V" }, meanings: { en: ["become"] } }],
    });
    const causativeEntry = createEntry({
      id: 6,
      headword: "ϫⲡⲟ",
      relations: [
        {
          type: "CAUS_OF",
          targetId: targetEntry.id,
        },
      ],
      senses: [
        {
          grammar: { pos: "V", valency: "TR" },
          meanings: { en: ["beget"] },
        },
      ],
    });

    expect(
      toDictionaryClientEntry(
        causativeEntry,
        new Map([[targetEntry.id, targetEntry]]),
      ),
    ).toMatchObject({
      id: 6,
      relations: [
        {
          targetId: 13,
          targetEntry: {
            headword: "ϣⲱⲡⲉ",
            id: 13,
          },
          type: "CAUS_OF",
        },
      ],
    });
  });
});
