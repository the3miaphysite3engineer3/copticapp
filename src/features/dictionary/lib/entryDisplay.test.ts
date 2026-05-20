import { describe, expect, it } from "vitest";

import type {
  DictionarySenseGrammarGender,
  LexicalEntry,
} from "@/features/dictionary/types";

import {
  formatDialectForms,
  formatImperativeForms,
  getAllPluralForms,
  formatPrincipalDialectForms,
  getDialectImperativeForms,
  getDialectImperativeVariantForms,
  getDialectPluralForms,
  getDialectPrimaryImperativeForms,
  getDialectPrimaryImperativeDisplayForms,
  getDialectVariantRows,
  getGenderedDialectFormParts,
  getGenderedHeadingParts,
  getPreferredEntryDialectKey,
  getPreferredEntryDisplaySpelling,
  getPreferredEntryPrincipalSpelling,
} from "./entryDisplay";

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

describe("dictionary entry display helpers", () => {
  it("prefers Bohairic forms when the app default dialect is Bohairic", () => {
    const entry = createEntry({
      id: 173,
      headword: "ⲥⲁϫⲓ",
      dialects: {
        B: {
          absolute: "ϭⲁϫⲓ",
          nominal: "ϭⲁϫ",
          pronominal: "",
          stative: "",
          variants: {
            absolute: ["ϫⲁϫⲓ"],
          },
        },
        S: {
          absolute: "ⲥⲁϫⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryDialectKey(entry)).toBe("B");
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ϭⲁϫⲓ ϭⲁϫ");
  });

  it("falls back to Sahidic when Bohairic is unavailable", () => {
    const entry = createEntry({
      id: 174,
      headword: "ⲥⲁϫⲓ",
      dialects: {
        S: {
          absolute: "ⲥⲁϫⲓ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryDialectKey(entry)).toBe("S");
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲥⲁϫⲓ");
  });

  it("does not prepend the headword when a dialect only has bound forms", () => {
    const entry = createEntry({
      id: 361,
      headword: "ϩⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⳳⲉⲛ-",
          pronominal: "ⲛⳳⲏⲧ=",
          stative: "",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⳳⲉⲛ-/ⲛⳳⲏⲧ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⳳⲉⲛ-/ⲛⳳⲏⲧ=");
  });

  it("shows the Bohairic with entry as nominal plus pronominal bound forms", () => {
    const entry = createEntry({
      id: 892,
      headword: "ⲙⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲛⲉⲙ-",
          pronominal: "ⲛⲉⲙⲁ=",
          stative: "",
        },
      },
      senses: [
        { grammar: { pos: "PREP" }, meanings: { en: ["preposition, with"] } },
      ],
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲛⲉⲙ-/ⲛⲉⲙⲁ=");
  });

  it("shows the primary construct participle after verbal forms", () => {
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
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
    );
    expect(formatPrincipalDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϭⲓ ϭⲓ-/ϭⲓⲧ=",
    );
  });

  it("collapses matching nominal and pronominal bound stems", () => {
    const entry = createEntry({
      id: 259734521,
      headword: "ⲙⲟϩ",
      dialects: {
        B: {
          absolute: "ⲙⲟϩ",
          nominal: "ⲙⲁϩ-",
          pronominal: "ⲙⲁϩ=",
          stative: "ⲙⲉϩ†",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲙⲟϩ ⲙⲁϩ-/= ⲙⲉϩ†",
    );
  });

  it("keeps different nominal and pronominal bound stems separate", () => {
    const entry = createEntry({
      id: 3738322353,
      headword: "ⲙⲛ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲛⲉⲙ-",
          pronominal: "ⲛⲉⲙⲁ=",
          stative: "",
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲛⲉⲙ-/ⲛⲉⲙⲁ=",
    );
  });

  it("returns secondary construct participles for the variants section", () => {
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
    });

    expect(getDialectVariantRows(entry.dialects.B)).toEqual([
      {
        forms: ["ϭⲁⲩ~"],
        state: "constructParticiples",
      },
    ]);
  });

  it("returns imperative forms separately without adding them to the header", () => {
    const entry = createEntry({
      id: 2,
      headword: "ϯ",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
      inflections: {
        imperative: {
          B: {
            absolute: ["ⲙⲟⲓ"],
            nominal: ["ⲙⲁ-"],
            pronominal: ["ⲙⲏⲓ="],
          },
        },
      },
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ϯ ϯ-/ⲧⲏⲓ= ⲧⲟⲓ†",
    );
    expect(getDialectVariantRows(entry.dialects.B)).toEqual([]);
    expect(getDialectImperativeForms(entry, "B")).toEqual([
      "ⲙⲟⲓ",
      "ⲙⲁ-",
      "ⲙⲏⲓ=",
    ]);
    expect(getDialectPrimaryImperativeForms(entry, "B")).toEqual({
      absolute: "ⲙⲟⲓ",
      nominal: "ⲙⲁ-",
      pronominal: "ⲙⲏⲓ=",
    });
    expect(formatImperativeForms(getDialectImperativeForms(entry, "B"))).toBe(
      "ⲙⲟⲓ ⲙⲁ-/ⲙⲏⲓ=",
    );
    expect(
      formatImperativeForms(getDialectPrimaryImperativeForms(entry, "B")),
    ).toBe("ⲙⲟⲓ ⲙⲁ-/ⲙⲏⲓ=");
    expect(getDialectImperativeVariantForms(entry, "B")).toEqual([]);
  });

  it("keeps non-canonical imperative lists comma-separated", () => {
    expect(formatImperativeForms(["ⲁⲣⲓ-", "ⲉⲣⲓ-"])).toBe("ⲁⲣⲓ-, ⲉⲣⲓ-");
  });

  it("keeps gendered imperative forms in the primary imperative display", () => {
    const entry = createEntry({
      id: 5,
      headword: "ⲉⲓ",
      dialects: {
        B: {
          absolute: "ⲓ̀",
        },
      },
      inflections: {
        imperative: {
          B: {
            absolute: [
              { form: "ⲁⲙⲟⲩ", gender: "M", number: "SG" },
              { form: "ⲁⲙⲏ", gender: "F", number: "SG" },
              { form: "ⲁⲙⲱⲓⲛⲓ", number: "PL" },
            ],
          },
        },
      },
    });

    expect(getDialectPrimaryImperativeForms(entry, "B")).toEqual({
      absolute: "ⲁⲙⲟⲩ",
    });
    expect(getDialectPrimaryImperativeDisplayForms(entry, "B")).toEqual([
      {
        form: "ⲁⲙⲟⲩ",
        gender: "M",
        number: "SG",
        role: "absolute",
      },
      {
        form: "ⲁⲙⲏ",
        gender: "F",
        number: "SG",
        role: "absolute",
      },
      {
        form: "ⲁⲙⲱⲓⲛⲓ",
        number: "PL",
        role: "absolute",
      },
    ]);
    expect(getDialectImperativeVariantForms(entry, "B")).toEqual([]);
  });

  it("returns secondary imperative forms for the variants section", () => {
    const entry = createEntry({
      id: 2,
      headword: "ϯ",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
      inflections: {
        imperative: {
          B: {
            absolute: ["ⲙⲟⲓ"],
            nominal: ["ⲙⲁ-"],
            pronominal: ["ⲙⲏⲓ="],
            variants: {
              nominal: ["ⲙⲉ-"],
              pronominal: ["ⲙⲏⲓⲧ=", "ⲙⲟⲓⲧ="],
            },
          },
        },
      },
    });

    expect(getDialectPrimaryImperativeForms(entry, "B")).toEqual({
      absolute: "ⲙⲟⲓ",
      nominal: "ⲙⲁ-",
      pronominal: "ⲙⲏⲓ=",
    });
    expect(getDialectImperativeForms(entry, "B")).toEqual([
      "ⲙⲟⲓ",
      "ⲙⲁ-",
      "ⲙⲉ-",
      "ⲙⲏⲓ=",
      "ⲙⲏⲓⲧ=",
      "ⲙⲟⲓⲧ=",
    ]);
    expect(getDialectImperativeVariantForms(entry, "B")).toEqual([
      "ⲙⲉ-",
      "ⲙⲏⲓⲧ=",
      "ⲙⲟⲓⲧ=",
    ]);
  });

  it("uses absolute plus bound forms for principal spellings", () => {
    const baseEntry = createEntry({
      id: 2,
      headword: "ϯ",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
    });
    const relatedEntry = createEntry({
      id: 4173082558,
      headword: "ⲙⲟⲓ",
      dialects: {
        B: {
          absolute: "ⲙⲟⲓ",
          nominal: "ⲙⲁ-",
          pronominal: "ⲙⲏⲓ=",
          stative: "",
        },
      },
    });

    expect(getPreferredEntryPrincipalSpelling(baseEntry)).toBe("ϯ ϯ-/ⲧⲏⲓ=");
    expect(getPreferredEntryPrincipalSpelling(relatedEntry)).toBe(
      "ⲙⲟⲓ ⲙⲁ-/ⲙⲏⲓ=",
    );
  });

  it("builds gendered noun headings from structured feminine and plural forms", () => {
    const kingEntry = createEntry({
      id: 18,
      headword: "ⲣⲣⲟ",
      dialects: {
        B: {
          absolute: "ⲟⲩⲣⲟ",
        },
      },
      grammarGender: "M",
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

    expect(getGenderedHeadingParts(kingEntry, "B")).toEqual([
      {
        entryId: 18,
        marker: "m",
        spelling: "ⲟⲩⲣⲟ",
      },
      {
        marker: "f",
        spelling: "ⲟⲩⲣⲱ",
      },
      {
        marker: "pl",
        spelling: "ⲟⲩⲣⲱⲟⲩ",
      },
    ]);
  });

  it("keeps same-spelling masculine and feminine forms visible", () => {
    const masculineEntry = createEntry({
      id: 4230019348,
      headword: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      dialects: {
        B: {
          absolute: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
        },
      },
      grammarGender: "M",
      inflections: {
        feminine: {
          B: {
            default: ["ⲡⲁⲣⲑⲉⲛⲟⲥ"],
          },
        },
      },
    });

    expect(getGenderedHeadingParts(masculineEntry, "B")).toEqual([
      {
        entryId: 4230019348,
        marker: "m",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
      {
        marker: "f",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
    ]);
    expect(getGenderedDialectFormParts(masculineEntry, "B")).toEqual([
      {
        entryId: 4230019348,
        marker: "m",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
      {
        marker: "f",
        spelling: "ⲡⲁⲣⲑⲉⲛⲟⲥ",
      },
    ]);
  });

  it("builds exact-dialect gendered form rows without borrowing fallback forms", () => {
    const servantEntry = createEntry({
      id: 550,
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
        F: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
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

    expect(getGenderedDialectFormParts(servantEntry, "B")).toEqual([
      {
        entryId: 550,
        marker: "m",
        spelling: "ⲃⲱⲕ",
      },
      {
        marker: "f",
        spelling: "ⲃⲱⲕⲓ",
      },
      {
        marker: "pl",
        spelling: "ⲉⲃⲓⲁⲓⲕ",
      },
    ]);
    expect(getGenderedDialectFormParts(servantEntry, "F")).toEqual([]);
  });

  it("collects structured plural forms for display", () => {
    const entry = createEntry({
      id: 3466788471,
      headword: "ⲁϩⲟ",
      inflections: {
        dual: {
          S: {
            default: ["ⲁϩⲟⲩⲉ"],
          },
        },
        plural: {
          B: {
            default: ["ⲁϩⲱⲣ"],
          },
          S: {
            default: ["ⲁϩⲱⲱⲣ", "ⲉϩⲱⲣ", "ⲁϩⲱⲣⲉ"],
          },
        },
      },
    });

    expect(getDialectPluralForms(entry, "S")).toEqual([
      "ⲁϩⲱⲱⲣ",
      "ⲉϩⲱⲣ",
      "ⲁϩⲱⲣⲉ",
    ]);
    expect(
      getDialectPluralForms(entry, "S", { includeUnscoped: true }),
    ).toEqual(["ⲁϩⲱⲱⲣ", "ⲉϩⲱⲣ", "ⲁϩⲱⲣⲉ"]);
    expect(getAllPluralForms(entry)).toEqual([
      "ⲁϩⲱⲣ",
      "ⲁϩⲱⲱⲣ",
      "ⲉϩⲱⲣ",
      "ⲁϩⲱⲣⲉ",
    ]);
  });

  it("does not build gendered headings without structured feminine forms", () => {
    const servantEntry = createEntry({
      id: 550,
      headword: "ⲃⲱⲕ",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      grammarGender: "M",
      inflections: {
        plural: {
          B: {
            default: ["ⲉⲃⲓⲁⲓⲕ"],
          },
        },
      },
    });

    expect(getGenderedHeadingParts(servantEntry, "B")).toEqual([]);
  });

  it("returns no variant rows without secondary forms", () => {
    const entry = createEntry({
      id: 121,
      headword: "ϣⲱⲧ",
      dialects: {
        B: {
          absolute: "ϣⲱⲧ",
          nominal: "ϣⲉⲧ-",
          pronominal: "ϣⲁⲧ=",
          stative: "ϣⲁⲧ†",
          participles: ["ϣⲁⲧ~"],
        },
      },
    });

    expect(getDialectVariantRows(entry.dialects.B)).toEqual([]);
    expect(getDialectVariantRows(undefined)).toEqual([]);
  });

  it("orders dialect variants by grammatical state", () => {
    const entry = createEntry({
      id: 2860173517,
      headword: "ⲕⲱ",
      dialects: {
        S: {
          absolute: "ⲕⲱ",
          nominal: "ⲕⲁ-",
          pronominal: "ⲕⲁ=",
          stative: "ⲕⲏ†",
          participles: ["ⲕⲁ~"],
          variants: {
            constructParticiples: ["ⲕⲉ~"],
            absolute: ["ⲕⲉ"],
            pronominal: ["ⲕⲉ="],
          },
        },
      },
    });

    expect(getDialectVariantRows(entry.dialects.S)).toEqual([
      {
        forms: ["ⲕⲉ"],
        state: "absolute",
      },
      {
        forms: ["ⲕⲉ="],
        state: "pronominal",
      },
      {
        forms: ["ⲕⲉ~"],
        state: "constructParticiples",
      },
    ]);
  });

  it("shows the Bohairic between entry as nominal plus pronominal bound forms", () => {
    const entry = createEntry({
      id: 1713,
      headword: "ⲟⲩⲧⲉ-",
      dialects: {
        B: {
          absolute: "",
          nominal: "ⲟⲩⲧⲉ-",
          pronominal: "ⲟⲩⲧⲱ=",
          stative: "",
        },
      },
      senses: [
        { grammar: { pos: "PREP" }, meanings: { en: ["between, among"] } },
      ],
    });

    expect(formatDialectForms(entry.dialects.B!, entry.headword)).toBe(
      "ⲟⲩⲧⲉ-/ⲟⲩⲧⲱ=",
    );
    expect(getPreferredEntryDisplaySpelling(entry)).toBe("ⲟⲩⲧⲉ-/ⲟⲩⲧⲱ=");
  });
});
