import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DICTIONARY_DIALECT_CODES } from "@/features/dictionary/config";
import { getGenderedHeadingParts } from "@/features/dictionary/lib/entryDisplay";
import type {
  ConstructParticipleCompound,
  DialectForms,
  LexicalEntry,
} from "@/features/dictionary/types";

function readDictionary() {
  const filePath = path.join(process.cwd(), "public/data/dictionary.json");

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as LexicalEntry[];
}

function splitTopLevelCommaSeparatedValues(value: string) {
  const parts: string[] = [];
  let currentPart = "";
  let bracketDepth = 0;
  let parenthesisDepth = 0;

  for (const character of value) {
    if (character === "(") {
      parenthesisDepth += 1;
    } else if (character === ")" && parenthesisDepth > 0) {
      parenthesisDepth -= 1;
    } else if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    }

    if (character === "," && bracketDepth === 0 && parenthesisDepth === 0) {
      parts.push(currentPart.trim());
      currentPart = "";
    } else {
      currentPart += character;
    }
  }

  parts.push(currentPart.trim());

  return parts.filter(Boolean);
}

function hasHeadwordOrAbsoluteStructuralNotation(value: string) {
  const standaloneGenderMarker = /\(([ⲡⲧ](?:\s*,\s*[ⲡⲧ])*)\)(?=\s|$|→|=|,)/u;
  const standalonePluralMarker = /(^|\s)\(ⲛ\)(?=\s|$|→|=|,)/u;

  return (
    /[,=→]/u.test(value) ||
    standaloneGenderMarker.test(value) ||
    standalonePluralMarker.test(value)
  );
}

function collectConstructParticiples(forms: DialectForms | undefined) {
  return [
    ...(forms?.constructParticiples ?? []),
    ...(forms?.variants?.constructParticiples ?? []),
  ];
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateConstructParticipleCompound(
  compound: ConstructParticipleCompound,
) {
  return (
    typeof compound.form === "string" &&
    compound.form.trim().length > 0 &&
    !compound.form.endsWith("~") &&
    (compound.sourceConstructParticiple === undefined ||
      compound.sourceConstructParticiple.endsWith("~")) &&
    (compound.gender === undefined ||
      ["", "BOTH", "F", "M"].includes(compound.gender)) &&
    isNonEmptyStringArray(compound.english_meanings) &&
    (compound.dutch_meanings === undefined ||
      isNonEmptyStringArray(compound.dutch_meanings))
  );
}

describe("dictionary dataset guardrails", () => {
  it("keeps dialect and plural-form keys within the configured dictionary sigla", () => {
    const dictionary = readDictionary();
    const allowedDialectCodes = new Set<string>(DICTIONARY_DIALECT_CODES);
    const unexpectedDialectKeys: Array<{ dialect: string; id: string }> = [];
    const unexpectedPluralFormKeys: Array<{ dialect: string; id: string }> = [];

    for (const entry of dictionary) {
      for (const dialect of Object.keys(entry.dialects)) {
        if (!allowedDialectCodes.has(dialect)) {
          unexpectedDialectKeys.push({ dialect, id: entry.id });
        }
      }

      for (const dialect of Object.keys(entry.pluralForms ?? {})) {
        if (!allowedDialectCodes.has(dialect)) {
          unexpectedPluralFormKeys.push({ dialect, id: entry.id });
        }
      }
    }

    expect(unexpectedDialectKeys).toEqual([]);
    expect(unexpectedPluralFormKeys).toEqual([]);
  });

  it("omits source-only metadata from runtime dictionary entries", () => {
    const dictionary = readDictionary();
    const forbiddenKeys = new Set([
      "attestation",
      "attestations",
      "raw",
      "rawData",
      "sourceNote",
      "sourceNotes",
    ]);
    const sourceOnlyMetadataKeys = dictionary.flatMap((entry) =>
      Object.keys(entry)
        .filter((key) => forbiddenKeys.has(key))
        .map((key) => ({ id: entry.id, key })),
    );

    expect(sourceOnlyMetadataKeys).toEqual([]);
  });

  it("keeps primary spellings free of variant lists and state metadata", () => {
    const dictionary = readDictionary();
    const structurallyNoisyFields: Array<{
      field: string;
      id: string;
      value: string;
    }> = [];
    const primaryFormFields = [
      "absolute",
      "nominal",
      "pronominal",
      "stative",
    ] as const;

    for (const entry of dictionary) {
      if (
        splitTopLevelCommaSeparatedValues(entry.headword).length > 1 ||
        hasHeadwordOrAbsoluteStructuralNotation(entry.headword)
      ) {
        structurallyNoisyFields.push({
          field: "headword",
          id: entry.id,
          value: entry.headword,
        });
      }

      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        for (const field of primaryFormFields) {
          const value = forms[field] ?? "";

          if (
            splitTopLevelCommaSeparatedValues(value).length > 1 ||
            (field === "absolute" &&
              hasHeadwordOrAbsoluteStructuralNotation(value))
          ) {
            structurallyNoisyFields.push({
              field: `${dialect}.${field}`,
              id: entry.id,
              value,
            });
          }
        }

        for (const value of forms.variants?.absolute ?? []) {
          if (hasHeadwordOrAbsoluteStructuralNotation(value)) {
            structurallyNoisyFields.push({
              field: `${dialect}.variants.absolute`,
              id: entry.id,
              value,
            });
          }
        }
      }
    }

    expect(structurallyNoisyFields).toEqual([]);
  });

  it("keeps the Bohairic imperative for give on its paradigm entry", () => {
    const dictionary = readDictionary();
    const parentEntry = dictionary.find((entry) => entry.id === "cd_2");
    const imperativeEntry = dictionary.find((entry) => entry.id === "cd_2b");

    expect(parentEntry?.dialects.B).toMatchObject({
      absolute: "ϯ",
      imperatives: ["ⲙⲟⲓ", "ⲙⲁ-", "ⲙⲏⲓ="],
      variants: {
        pronominal: ["ⲧⲏⲓⲧ="],
      },
    });
    expect(parentEntry).not.toHaveProperty("bohairicParadigmData");
    expect(imperativeEntry).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲙⲟⲓ",
          nominal: "ⲙⲁ-",
          pronominal: "ⲙⲏⲓ=",
          variants: {
            pronominal: ["ⲙⲏⲓⲧ=", "ⲙⲟⲓⲧ="],
          },
        },
      },
      parentEntryId: "cd_2",
      relationType: "paradigm-member",
    });
  });

  it("keeps masculine feminine-counterpart links displayable as gendered headings", () => {
    const dictionary = readDictionary();
    const entriesById = new Map(dictionary.map((entry) => [entry.id, entry]));
    const feminineCounterpartsByParentId = new Map<string, LexicalEntry[]>();

    for (const entry of dictionary) {
      if (
        entry.relationType !== "feminine-counterpart" ||
        !entry.parentEntryId
      ) {
        continue;
      }

      const counterparts =
        feminineCounterpartsByParentId.get(entry.parentEntryId) ?? [];
      counterparts.push(entry);
      feminineCounterpartsByParentId.set(entry.parentEntryId, counterparts);
    }

    const blockedMasculineParents: Array<{ id: string; parts: string[] }> = [];
    const masculineParentIds = [...feminineCounterpartsByParentId.keys()]
      .map((id) => entriesById.get(id))
      .filter(
        (entry): entry is LexicalEntry =>
          Boolean(entry) && entry.gender === "M",
      )
      .map((entry) => {
        const parts = getGenderedHeadingParts(
          entry,
          feminineCounterpartsByParentId.get(entry.id) ?? [],
        );
        const markers = parts.map((part) => part.marker);

        if (!markers.includes("m") || !markers.includes("f")) {
          blockedMasculineParents.push({
            id: entry.id,
            parts: parts.map((part) => `${part.spelling} ${part.marker}`),
          });
        }

        return entry.id;
      })
      .sort((left, right) => left.localeCompare(right));

    expect(blockedMasculineParents).toEqual([]);
    expect(masculineParentIds.length).toBeGreaterThanOrEqual(19);
    expect(
      getGenderedHeadingParts(
        entriesById.get("cd_18")!,
        feminineCounterpartsByParentId.get("cd_18") ?? [],
      ).map((part) => `${part.spelling} ${part.marker}`),
    ).toEqual(["ⲟⲩⲣⲟ m", "ⲟⲩⲣⲱ f", "ⲟⲩⲣⲱⲟⲩ pl"]);
    expect(entriesById.get("cd_18")?.genderedMeanings).toEqual([
      {
        dutch: {
          f: "koningin",
          m: "koning",
          pl: "koninklijken",
        },
        english: {
          f: "queen",
          m: "king",
          pl: "royals",
        },
      },
    ]);
    expect(
      getGenderedHeadingParts(
        entriesById.get("cd_550")!,
        feminineCounterpartsByParentId.get("cd_550") ?? [],
      ).map((part) => `${part.spelling} ${part.marker}`),
    ).toEqual(["ⲃⲱⲕ m", "ⲃⲱⲕⲓ f", "ⲉⲃⲓⲁⲓⲕ pl"]);
  });

  it("keeps Oxyrhynchite coverage under dialect M", () => {
    const dictionary = readDictionary();
    const oxyrhynchiteEntries = dictionary.filter((entry) => entry.dialects.M);

    expect(oxyrhynchiteEntries.length).toBeGreaterThanOrEqual(487);
    expect(
      dictionary.find((entry) => entry.id === "cd_493")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲛⲁⲕ",
      nominal: "ⲁⲛⲕ-",
    });
    expect(dictionary.find((entry) => entry.id === "cd_7166")).toMatchObject({
      dialects: {
        M: {
          absolute: "ϫⲗⲉ",
        },
      },
      english_meanings: ["fence"],
      pos: "N",
    });
  });

  it("stores construct participles as tilde-marked forms outside nominal state", () => {
    const dictionary = readDictionary();
    const invalidConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];
    const secondaryCanonicalConstructParticiples: Array<{
      dialect: string;
      forms: string[];
      id: string;
    }> = [];
    const nominalConstructParticiples: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];

    for (const entry of dictionary) {
      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        if (/^PC\b/u.test(forms.nominal ?? "")) {
          nominalConstructParticiples.push({
            dialect,
            form: forms.nominal ?? "",
            id: entry.id,
          });
        }

        if ((forms.constructParticiples?.length ?? 0) > 1) {
          secondaryCanonicalConstructParticiples.push({
            dialect,
            forms: forms.constructParticiples ?? [],
            id: entry.id,
          });
        }

        for (const form of collectConstructParticiples(forms)) {
          if (!form.endsWith("~") || /\s/.test(form)) {
            invalidConstructParticiples.push({
              dialect,
              form,
              id: entry.id,
            });
          }
        }
      }
    }

    expect(nominalConstructParticiples).toEqual([]);
    expect(secondaryCanonicalConstructParticiples).toEqual([]);
    expect(invalidConstructParticiples).toEqual([]);
    expect(
      dictionary.find((entry) => entry.id === "cd_130")?.dialects.B,
    ).toMatchObject({
      constructParticiples: ["ϭⲁⲓ~"],
      nominal: "ϭⲓ-",
      pronominal: "ϭⲓⲧ=",
      stative: "ϭⲏⲟⲩ†",
      variants: {
        constructParticiples: ["ϭⲁⲩ~"],
      },
    });
  });

  it("validates construct participle compound records when present", () => {
    const dictionary = readDictionary();
    const malformedCompounds: Array<{
      dialect: string;
      form: string;
      id: string;
    }> = [];
    let compoundCount = 0;

    for (const entry of dictionary) {
      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        for (const compound of forms.constructParticipleCompounds ?? []) {
          compoundCount += 1;

          if (!validateConstructParticipleCompound(compound)) {
            malformedCompounds.push({
              dialect,
              form: compound.form,
              id: entry.id,
            });
          }
        }
      }
    }

    expect(malformedCompounds).toEqual([]);
    expect(compoundCount).toBeGreaterThanOrEqual(260);
  });

  it("keeps meaning group English and Dutch glosses aligned", () => {
    const dictionary = readDictionary();

    const mismatchedGroups = dictionary.flatMap((entry) =>
      Object.entries(entry.meaningGroups ?? {})
        .map(([groupKey, group]) => ({
          dutchCount: group.dutch_meanings?.length ?? 0,
          englishCount: group.english_meanings?.length ?? 0,
          groupKey,
          id: entry.id,
        }))
        .filter(
          ({ dutchCount, englishCount }) =>
            dutchCount !== englishCount && (dutchCount > 0 || englishCount > 0),
        ),
    );

    expect(mismatchedGroups).toEqual([]);
  });

  it("stores representative bound-only prepositions without fake absolute forms", () => {
    const dictionary = readDictionary();
    const boundOnlyEntries = [
      {
        id: "cd_361",
        dialect: "B",
        nominal: "ⳳⲉⲛ-",
        pronominal: "ⲛ̀ⳳⲏⲧ=",
      },
      {
        id: "cd_892",
        dialect: "B",
        nominal: "ⲛⲉⲙ-",
        pronominal: "ⲛⲉⲙⲁ=",
      },
      {
        id: "cd_1713",
        dialect: "B",
        nominal: "ⲟⲩⲧⲉ-",
        pronominal: "ⲟⲩⲧⲱ=",
      },
    ] as const;

    for (const expected of boundOnlyEntries) {
      const entry = dictionary.find(
        (candidate) => candidate.id === expected.id,
      );
      const forms = entry?.dialects[expected.dialect];

      expect(forms).toMatchObject({
        nominal: expected.nominal,
        pronominal: expected.pronominal,
      });
      expect(forms).not.toHaveProperty("absolute");
    }
  });
});
