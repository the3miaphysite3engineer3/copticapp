import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DICTIONARY_DIALECT_CODES } from "@/features/dictionary/config";
import type {
  ConstructParticipleCompound,
  DialectForms,
  LexicalEntry,
} from "@/features/dictionary/types";

function hasUppercaseCopticCharacter(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    const isCoptic =
      codePoint !== undefined &&
      ((codePoint >= 0x2c80 && codePoint <= 0x2cff) ||
        (codePoint >= 0x03e2 && codePoint <= 0x03ef));

    if (isCoptic && character !== character.toLowerCase()) {
      return true;
    }
  }

  return false;
}

function collectDictionaryStrings(value: unknown, results: string[] = []) {
  if (typeof value === "string") {
    results.push(value);
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectDictionaryStrings(item, results));
    return results;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) =>
      collectDictionaryStrings(item, results),
    );
  }

  return results;
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

function collectMeaningGlosses(entry: LexicalEntry) {
  const paradigmData = entry.bohairicParadigmData as {
    englishMeanings?: string[];
    dutchMeanings?: string[];
  };
  return [
    ...(entry.english_meanings ?? []),
    ...(entry.dutch_meanings ?? []),
    ...(paradigmData?.englishMeanings ?? []),
    ...(paradigmData?.dutchMeanings ?? []),
  ];
}

function hasGreekOrCopticCharacter(value: string) {
  return /[\u0370-\u03ff\u1f00-\u1fff\u2c80-\u2cff]/u.test(value);
}

function collectSourceEquivalentBrackets(value: string) {
  return [...value.matchAll(/\[[^\]]+\]/gu)]
    .map((match) => match[0])
    .filter((bracketedValue) => hasGreekOrCopticCharacter(bracketedValue));
}

function collectDutchMeaningPairs(entry: LexicalEntry) {
  const paradigmData = entry.bohairicParadigmData as {
    dutchMeanings?: string[];
    englishMeanings?: string[];
  };
  const pairs: Array<{
    dutchMeanings: string[] | undefined;
    englishMeanings: string[] | undefined;
    id: string;
  }> = [
    {
      dutchMeanings: entry.dutch_meanings,
      englishMeanings: entry.english_meanings,
      id: entry.id,
    },
  ];

  if (paradigmData) {
    pairs.push({
      dutchMeanings: paradigmData.dutchMeanings,
      englishMeanings: paradigmData.englishMeanings,
      id: `${entry.id}:bohairicParadigmData`,
    });
  }

  for (const [dialect, forms] of Object.entries(entry.dialects)) {
    for (const compound of forms.constructParticipleCompounds ?? []) {
      pairs.push({
        dutchMeanings: compound.dutch_meanings,
        englishMeanings: compound.english_meanings,
        id: `${entry.id}:${dialect}:${compound.form}`,
      });
    }
  }

  return pairs;
}

describe("dictionary dataset guardrails", () => {
  it("keeps modern lowercase Coptic spellings in the checked-in dictionary snapshot", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionaryJson = fs.readFileSync(filePath, "utf8");

    expect(dictionaryJson).not.toMatch(/"absoluteVariants"/);
    expect(dictionaryJson).not.toMatch(/\bsA\b/u);
    expect(dictionaryJson).not.toMatch(/[\u03e6\u03e7]/u);
    expect(dictionaryJson).toMatch(/[Ⳳⳳ]/u);
    expect(hasUppercaseCopticCharacter(dictionaryJson)).toBe(false);
  });

  it("keeps dialect keys within the configured dictionary sigla", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const allowedDialectCodes = new Set<string>(DICTIONARY_DIALECT_CODES);
    const unexpectedDialectKeys: Array<{ dialect: string; id: string }> = [];

    for (const entry of dictionary) {
      for (const dialect of Object.keys(entry.dialects)) {
        if (!allowedDialectCodes.has(dialect)) {
          unexpectedDialectKeys.push({ dialect, id: entry.id });
        }
      }
    }

    expect(unexpectedDialectKeys).toEqual([]);
  });

  it("keeps dictionary entry ids dialect-agnostic", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];

    expect(dictionary.filter((entry) => /^cd_m_/u.test(entry.id))).toEqual([]);
  });

  it("keeps variant spellings out of primary headword and dialect form fields", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const commaSeparatedPrimaryFields: Array<{
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
      if (splitTopLevelCommaSeparatedValues(entry.headword).length > 1) {
        commaSeparatedPrimaryFields.push({
          field: "headword",
          id: entry.id,
          value: entry.headword,
        });
      }

      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        for (const field of primaryFormFields) {
          const value = forms[field] ?? "";

          if (splitTopLevelCommaSeparatedValues(value).length > 1) {
            commaSeparatedPrimaryFields.push({
              field: `${dialect}.${field}`,
              id: entry.id,
              value,
            });
          }
        }
      }
    }

    expect(commaSeparatedPrimaryFields).toEqual([]);
    expect(dictionary.find((entry) => entry.id === "cd_3368")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲅⲓⲟⲥ",
          variants: {
            absolute: ["ⲁⲅⲓⲟⲛ"],
          },
        },
      },
      headword: "ⲁⲅⲓⲟⲥ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_3356")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲅⲅⲉⲗⲓⲕⲟⲥ",
          variants: {
            absolute: ["ⲁⲅⲅⲉⲗⲓⲕⲟⲛ"],
          },
        },
      },
      headword: "ⲁⲅⲅⲉⲗⲓⲕⲟⲥ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_4600")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲕⲁⲑⲟⲗⲓⲕⲟⲥ",
          variants: {
            absolute: ["ⲕⲁⲑⲟⲗⲓⲕⲏ", "ⲕⲁⲑⲟⲗⲓⲕⲟⲛ"],
          },
        },
      },
      headword: "ⲕⲁⲑⲟⲗⲓⲕⲟⲥ",
    });
  });

  it("keeps headword and absolute forms free of state metadata and variant separators", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const structurallyNoisyAbsoluteForms: Array<{
      field: string;
      id: string;
      value: string;
    }> = [];

    for (const entry of dictionary) {
      if (hasHeadwordOrAbsoluteStructuralNotation(entry.headword)) {
        structurallyNoisyAbsoluteForms.push({
          field: "headword",
          id: entry.id,
          value: entry.headword,
        });
      }

      for (const [dialect, forms] of Object.entries(entry.dialects)) {
        if (hasHeadwordOrAbsoluteStructuralNotation(forms.absolute ?? "")) {
          structurallyNoisyAbsoluteForms.push({
            field: `${dialect}.absolute`,
            id: entry.id,
            value: forms.absolute ?? "",
          });
        }

        for (const value of forms.variants?.absolute ?? []) {
          if (hasHeadwordOrAbsoluteStructuralNotation(value)) {
            structurallyNoisyAbsoluteForms.push({
              field: `${dialect}.variants.absolute`,
              id: entry.id,
              value,
            });
          }
        }
      }
    }

    expect(structurallyNoisyAbsoluteForms).toEqual([]);
    expect(dictionary.find((entry) => entry.id === "cd_3707")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲣⲱⲙⲁ",
        },
      },
      gender: "M",
      headword: "ⲁⲣⲱⲙⲁ",
      pluralForms: {
        B: ["ⲁⲣⲱⲙⲁⲧⲁ"],
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3445")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲓⲭⲙⲁⲗⲱⲧⲟⲥ",
        },
      },
      gender: "BOTH",
      headword: "ⲁⲓⲭⲙⲁⲗⲱⲧⲟⲥ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_3471")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲕⲣⲓⲟⲥ",
          variants: {
            absolute: ["ⲁⲅⲣⲓⲟⲥ"],
          },
        },
      },
      headword: "ⲁⲕⲣⲓⲟⲥ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_3803")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲃⲁⲥⲓⲗⲓⲟⲛ",
        },
      },
      headword: "ⲃⲁⲥⲓⲗⲓⲟⲛ",
      pluralForms: {
        B: ["ⲃⲁⲥⲓⲗⲓⲟⲛ"],
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_48")).toMatchObject({
      dialects: {
        B: {
          absolute: "",
          pronominal: "ⲧⲏⲣ=",
        },
      },
      headword: "ⲧⲏⲣ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_2316")).toMatchObject({
      dialects: {
        F: {
          absolute: "",
          pronominal: "ϩⲉϫⲱϫ=",
        },
      },
    });

    const cd89B = dictionary.find((entry) => entry.id === "cd_89")?.dialects.B;
    expect(cd89B?.variants?.absolute ?? []).not.toEqual(
      expect.arrayContaining(["ⲥⲟⲧⲡ=", "ⲥⲁⲡⲧ="]),
    );
    expect(cd89B?.variants?.pronominal ?? []).toEqual(
      expect.arrayContaining(["ⲥⲟⲧⲡ=", "ⲥⲁⲡⲧ="]),
    );
    expect(dictionary.find((entry) => entry.id === "cd_3589")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲁⲛϩⲟⲗⲟⲙⲁ",
        },
      },
      headword: "ⲁⲛϩⲟⲗⲟⲙⲁ",
      pluralForms: {
        B: ["ⲁⲛⲁⲗⲱⲙⲁ"],
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3960")).toMatchObject({
      dialects: {
        B: {
          absolute: "ⲇⲓⲕⲁⲓⲟⲥ",
          variants: {
            absolute: ["ⲇⲓⲕⲉⲟⲛ", "ⲇⲓⲕⲉⲟⲥ"],
          },
        },
      },
      gender: "M",
      headword: "ⲇⲓⲕⲁⲓⲟⲥ",
    });
  });

  it("keeps the Bohairic imperative for give on its paradigm entry", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
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

  it("tags high-confidence Greek grammar-labeled entries", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const greekUnknownEntries = dictionary.filter(
      (entry) => entry.etymology === "Gr" && entry.pos === "UNKNOWN",
    );
    const highConfidenceGreekUnknownEntries: Array<{
      id: string;
      reason: string;
    }> = [];
    const verbEndingPattern = /(ⲉⲓⲛ|ⲓⲛ|ⲥⲑⲁⲓ|ⲥⲑⲉ|ⲍⲉ|ⲍⲓ)$/u;
    const explicitVerbGlossPattern =
      /\b(?:TR|INTR|IMPERS\.V)\b|\bwith V\b|\bfrom the Greek verb\b|\b(?:singular|plural)\s+IMP\b|\bIMP verb\b/i;
    const explicitAdjectiveGlossPattern = /\b(?:ADJ|as ADJ)\b/i;
    const adverbGlossPattern =
      /\b(?:ly|in general|generally|briefly|otherwise|actually|certainly|deservedly|carefully|simply|freely|frankly|rightly|powerfully|truly|really|completely|wholly|without|with certainty)\b/i;
    const explicitAdverbGlossPattern = /\badverb\b/i;
    const adverbExclusionPattern =
      /\b(?:amos|book|name|person|robe|instrument|place|god forbid)\b/i;
    const adjectiveGlossPattern =
      /\b(?:able|calm|catholic|chaste|clean|common|comprehensive|dead|general|heavenly|hidden|honorable|inclusive|invisible|lofty|personal|prophetic|pure|regular|righteous|steady|universal|unseen|venerable|without|amazing|astonishing|own)\b/i;
    const adjectiveExclusionPattern =
      /\b(?:person|father|prisoner|month|book)\b/i;
    const explicitConjunctionGlossPattern = /\bCONJ\b/i;
    const explicitInterjectionGlossPattern = /\bbehold,\s*lo\b/i;

    for (const entry of greekUnknownEntries) {
      const bohairicForms = entry.dialects.B;
      const forms = [
        bohairicForms?.absolute ?? entry.headword,
        ...(bohairicForms?.variants?.absolute ?? []),
      ];
      const primaryForm = forms[0] ?? "";
      const gloss = collectMeaningGlosses(entry).join(" | ");

      if (
        explicitVerbGlossPattern.test(gloss) ||
        forms.some((form) => verbEndingPattern.test(form))
      ) {
        highConfidenceGreekUnknownEntries.push({
          id: entry.id,
          reason: "verb",
        });
      } else if (
        explicitAdverbGlossPattern.test(gloss) ||
        (/ⲱⲥ$/u.test(primaryForm) &&
          adverbGlossPattern.test(gloss) &&
          !adverbExclusionPattern.test(gloss))
      ) {
        highConfidenceGreekUnknownEntries.push({
          id: entry.id,
          reason: "adverb",
        });
      } else if (
        explicitAdjectiveGlossPattern.test(gloss) ||
        (/ⲟⲥ$/u.test(primaryForm) &&
          forms.slice(1).some((form) => /ⲟⲛ$/u.test(form)) &&
          adjectiveGlossPattern.test(gloss) &&
          !adjectiveExclusionPattern.test(gloss))
      ) {
        highConfidenceGreekUnknownEntries.push({
          id: entry.id,
          reason: "adjective",
        });
      } else if (explicitConjunctionGlossPattern.test(gloss)) {
        highConfidenceGreekUnknownEntries.push({
          id: entry.id,
          reason: "conjunction",
        });
      } else if (explicitInterjectionGlossPattern.test(gloss)) {
        highConfidenceGreekUnknownEntries.push({
          id: entry.id,
          reason: "interjection",
        });
      }
    }

    expect(highConfidenceGreekUnknownEntries).toEqual([]);
    expect(greekUnknownEntries.length).toBeLessThanOrEqual(601);
    expect(dictionary.find((entry) => entry.id === "cd_3348")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_3361")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_3346")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_3691")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_4390")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_5554")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_6123")?.pos).toBe("V");
    expect(dictionary.find((entry) => entry.id === "cd_3470")?.pos).toBe("ADV");
    expect(dictionary.find((entry) => entry.id === "cd_3963")?.pos).toBe("ADV");
    expect(dictionary.find((entry) => entry.id === "cd_3917")?.pos).toBe("ADV");
    expect(dictionary.find((entry) => entry.id === "cd_3423")?.pos).toBe("ADJ");
    expect(dictionary.find((entry) => entry.id === "cd_3448")?.pos).toBe("ADJ");
    expect(dictionary.find((entry) => entry.id === "cd_3670")?.pos).toBe("ADJ");
    expect(dictionary.find((entry) => entry.id === "cd_4600")?.pos).toBe("ADJ");
    expect(dictionary.find((entry) => entry.id === "cd_4556")?.pos).toBe(
      "CONJ",
    );
    expect(dictionary.find((entry) => entry.id === "cd_4603")?.pos).toBe(
      "CONJ",
    );
    expect(dictionary.find((entry) => entry.id === "cd_4537")?.pos).toBe(
      "INTJ",
    );
  });

  it("includes imported Oxyrhynchite forms under dialect M", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const oxyrhynchiteEntries = dictionary.filter((entry) => entry.dialects.M);

    expect(oxyrhynchiteEntries.length).toBeGreaterThanOrEqual(487);
    expect(
      dictionary.find((entry) => entry.id === "cd_98")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲓⲕ",
    });
    expect(
      dictionary.find((entry) => entry.id === "cd_493")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲛⲁⲕ",
      nominal: "ⲁⲛⲕ-",
    });
    expect(
      dictionary.find((entry) => entry.id === "cd_23")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲁⲣⲓⲣⲉ",
      nominal: "ⲁⲣⲓ-",
      pronominal: "ⲁⲣⲓ=",
    });
    expect(
      dictionary.find((entry) => entry.id === "cd_3842")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲅⲉⲛⲉⲁ",
    });
    expect(
      dictionary.find((entry) => entry.id === "cd_3846")?.dialects.M,
    ).toMatchObject({
      absolute: "ⲅⲉⲛⲏⲙⲁ",
    });
    expect(dictionary.find((entry) => entry.id === "cd_1159")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲛⲓⲛⲉ",
          variants: {
            absolute: ["ⲛⲓⲛⲉⲓ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_6093")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲯⲉⲩⲇⲟⲡⲣⲟⲫⲏⲧⲏⲥ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_6248")).toMatchObject({
      dialects: {
        M: {
          absolute: "ϩⲩⲡⲟⲙⲟⲛⲏ",
          variants: {
            absolute: ["ⲑⲩⲡⲟⲙⲟⲛⲏ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_5934")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲫⲁⲓⲥⲉⲱⲥ",
          variants: {
            absolute: expect.arrayContaining(["ⲫⲁⲣⲓⲥⲉⲟⲥ"]),
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_6206")).toMatchObject({
      dialects: {
        M: {
          absolute: "ϩⲟⲧⲁⲛ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_5844")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲧⲟⲧⲉ",
          variants: {
            absolute: ["ⲧⲟⲧⲏ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_4827")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲕⲣⲓⲥⲉⲓⲥ",
          variants: {
            absolute: ["ⲕⲣⲓⲥⲓⲥ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_432")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲁⲣⲏⲃ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_39")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲁϫⲱ",
          pronominal: "ⲁϫⲓ=",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_1557")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲧⲁⲓⲙ",
          variants: {
            absolute: ["ⲧⲁⲉⲓⲙⲉ", "ⲧⲁⲉⲓⲙ", "ⲧⲁⲓⲙⲉ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3691")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲁⲣϫⲁⲓⲥⲑⲁⲓ",
          variants: {
            absolute: expect.arrayContaining(["ⲁⲣⲭⲉⲥⲑⲁⲓ"]),
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_2679")).toMatchObject({
      dialects: {
        M: {
          constructParticiples: ["ⲃⲁⲕ~"],
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_4599")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲕⲁⲑⲓⲥⲧⲁ",
          variants: {
            absolute: ["ⲕⲁⲧⲓⲥⲧⲁ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_6050")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲭⲣⲁⲥⲑⲁⲓ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3358")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲁⲅⲅⲏⲛ",
          variants: {
            absolute: ["ⲁⲅⲅⲓⲟⲛ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3362")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲁⲅⲉⲗⲏ",
          variants: {
            absolute: ["ⲁⲅⲁⲓⲗⲏ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_3960")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲇⲓⲕⲁⲓⲟⲥ",
          variants: {
            absolute: ["ⲇⲓⲕⲁⲓⲟⲛ", "ⲇⲓⲕⲁⲟⲓⲥ", "ⲇⲓⲕⲉⲟⲥ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_4004")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲇⲣⲁⲕⲱⲛ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_4066")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲉⲛⲉⲣⲅⲓⲁ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_4559")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲓⲟⲩⲇⲁⲓ",
          variants: {
            absolute: ["ⲓⲟⲇⲁⲓ", "ⲓⲟⲩⲇⲁⲓⲉⲓ", "ⲓⲟⲩⲇⲁⲓⲟⲥ", "ⲓⲟⲩⲇⲉⲓ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_5521")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲥⲁⲗⲡⲓⲅⲝ",
          variants: {
            absolute: ["ⲥⲁⲗⲡⲓⲅⲅⲟⲥ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_6109")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲱⲇⲏ",
          variants: {
            absolute: ["ⲟⲇⲏ"],
          },
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_5916")).toMatchObject({
      dialects: {
        M: {
          absolute: "ϩⲩⲡⲟⲡⲟⲇⲓⲟⲛ",
        },
      },
    });
    expect(dictionary.find((entry) => entry.id === "cd_7166")).toMatchObject({
      dialects: {
        M: {
          absolute: "ϫⲗⲉ",
        },
      },
      dutch_meanings: ["omheining"],
      english_meanings: ["fence"],
      pos: "N",
    });
    expect(dictionary.find((entry) => entry.id === "cd_10712")).toMatchObject({
      dialects: {
        M: {
          absolute: "ⲧⲉⲗⲓ",
        },
      },
      dutch_meanings: ["iets afmaken, voltooien"],
      english_meanings: ["to finish, complete s.th."],
      pos: "V",
    });
  });

  it("keeps remaining construct participle gloss labels normalized as PC", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    const dictionaryStrings = collectDictionaryStrings(dictionary);

    expect(dictionaryStrings.some((value) => /\bPC\b/u.test(value))).toBe(true);
    expect(
      dictionaryStrings.filter((value) =>
        /\bp\s+c\b\.?|\bp\s*\.\s*c\b\.?|\bpc\b\.?/u.test(value),
      ),
    ).toEqual([]);
  });

  it("stores construct participles as tilde-marked forms outside nominal state", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
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
        if (/^PC\b/u.test(forms.nominal)) {
          nominalConstructParticiples.push({
            dialect,
            form: forms.nominal,
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
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
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

  it("compacts comma-separated dialect sigla lists in meaning glosses", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const commaSeparatedDialectSigla =
      /\b(?:Fb|Sa|Sf|Sl|NH|A|B|F|L|M|O|S)(?:\s*,\s*(?:Fb|Sa|Sf|Sl|NH|A|B|F|L|M|O|S))+\b/u;

    expect(
      dictionary
        .flatMap((entry) => collectMeaningGlosses(entry))
        .filter((value) => commaSeparatedDialectSigla.test(value)),
    ).toEqual([]);
  });

  it("omits grammar label punctuation and trailing dialect sigla commas in meaning glosses", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const grammarLabelPunctuation =
      /(?:^|[\r\n|―—–-]\s*)\b(?:PC|IMPERS\.V|IMPERS|IMP|ADJ|AUX|INTR|STA|CONJ|PREP|ADV|TR|REFL|SFX|PFX|V|N|PRON|ART|INTJ)(?:\s*\([^)]*\))?[:,][ \t]*/u;
    const trailingDialectSiglaComma =
      /\b(?:Fb|Sa|Sf|Sl|A|B|F|L|M|O|S)+,[ \t]+/u;

    expect(
      dictionary
        .flatMap((entry) => collectMeaningGlosses(entry))
        .filter(
          (value) =>
            grammarLabelPunctuation.test(value) ||
            trailingDialectSiglaComma.test(value),
        ),
    ).toEqual([]);
  });

  it("uses canonical uppercase grammar labels in meaning glosses", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const legacyGrammarLabels =
      /\b(?:QUAL|auxil|causative|caus|tr|intr|adj|advb|adv|qual|qualitative|kwalitatief|conj|prep|refl|suff|pref|nn|pc|imperative|impers|impersonal)\b|\bint\.|\bnl:|\bkwaliteit\b|\bkwal\s*:/u;

    expect(
      dictionary
        .flatMap((entry) => collectMeaningGlosses(entry))
        .filter((value) => legacyGrammarLabels.test(value)),
    ).toEqual([]);
  });

  it("keeps Dutch meanings aligned with English source equivalents", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const mismatchedMeaningCounts: string[] = [];
    const missingSourceEquivalentBrackets: Array<{
      bracketedValue: string;
      id: string;
    }> = [];

    for (const entry of dictionary) {
      for (const pair of collectDutchMeaningPairs(entry)) {
        if (
          (pair.englishMeanings?.length ?? 0) !==
          (pair.dutchMeanings?.length ?? 0)
        ) {
          mismatchedMeaningCounts.push(pair.id);
          continue;
        }

        for (
          let index = 0;
          index < (pair.englishMeanings?.length ?? 0);
          index += 1
        ) {
          const englishMeaning = pair.englishMeanings?.[index] ?? "";
          const dutchMeaning = pair.dutchMeanings?.[index] ?? "";

          for (const bracketedValue of collectSourceEquivalentBrackets(
            englishMeaning,
          )) {
            if (!dutchMeaning.includes(bracketedValue)) {
              missingSourceEquivalentBrackets.push({
                bracketedValue,
                id: pair.id,
              });
            }
          }
        }
      }
    }

    expect(mismatchedMeaningCounts).toEqual([]);
    expect(missingSourceEquivalentBrackets).toEqual([]);
  });

  it("keeps Dutch glosses free of common machine-translation artifacts", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const awkwardDutchGlossArtifacts =
      /\b(?:wees|word|high)\b|\b(?:INTR|TR) liefde\b|\bwat (?:onbekend betekent|betekent (?:onbekend|onzeker|twijfelachtig))\b|\bconjunctie\b|\[[A-Za-z][A-Za-z\s,;.-]+\]/u;

    expect(
      dictionary
        .flatMap((entry) =>
          collectDutchMeaningPairs(entry).flatMap(
            (pair) => pair.dutchMeanings ?? [],
          ),
        )
        .filter((value) => awkwardDutchGlossArtifacts.test(value)),
    ).toEqual([]);
  });

  it("stores the ϩⲛ-/ⳳⲉⲛ- preposition entry as bound-only nominal and pronominal forms", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const entry = dictionary.find((candidate) => candidate.id === "cd_361");

    expect(entry).toBeDefined();
    expect(entry?.dialects.S).toMatchObject({
      absolute: "",
      nominal: "ϩⲛ-",
      pronominal: "ⲛϩⲏⲧ=",
    });
    expect(entry?.dialects.A).toMatchObject({
      absolute: "",
      nominal: "ⳉⲛ-",
      pronominal: "ⲛⳉⲏⲧ=",
    });
    expect(entry?.dialects.B).toMatchObject({
      absolute: "",
      nominal: "ⳳⲉⲛ-",
      pronominal: "ⲛ̀ⳳⲏⲧ=",
    });
  });

  it("tags ⲭⲉⲣⲉ as an interjection in the checked-in dictionary snapshot", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const entry = dictionary.find((candidate) => candidate.id === "cd_6002");

    expect(entry).toBeDefined();
    expect(entry?.pos).toBe("INTJ");
  });

  it("keeps the expanded preposition set tagged as PREP", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const prepositionEntryIds = [
      "cd_355",
      "cd_361",
      "cd_533",
      "cd_611",
      "cd_892",
      "cd_946",
      "cd_947",
      "cd_948",
      "cd_949",
      "cd_950",
      "cd_1173",
      "cd_1713",
      "cd_2073",
      "cd_2382",
      "cd_6272",
      "cd_6273",
      "cd_6274",
      "cd_6275",
      "cd_6276",
      "cd_6277",
      "cd_6278",
      "cd_6279",
      "cd_6280",
      "cd_6281",
      "cd_6282",
      "cd_6283",
      "cd_6284",
      "cd_6285",
      "cd_6286",
      "cd_6287",
      "cd_6288",
    ] as const;

    for (const id of prepositionEntryIds) {
      const entry = dictionary.find((candidate) => candidate.id === id);

      expect(entry).toBeDefined();
      expect(entry?.pos).toBe("PREP");
    }
  });

  it("keeps the expanded bohairic preposition set in canonical bound-form style", () => {
    const filePath = path.join(process.cwd(), "public/data/dictionary.json");
    const dictionary = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as LexicalEntry[];
    const boundOnlyEntries = [
      {
        id: "cd_611",
        nominal: "ⲉ̀-",
        pronominal: "ⲉ̀ⲣⲟ=",
        etymology: "Egy",
      },
      {
        id: "cd_533",
        nominal: "ⲁⲧϭⲛⲉ-",
        pronominal: "ⲁⲧϭⲛⲟⲩ=",
        etymology: "Egy",
      },
      {
        id: "cd_946",
        nominal: "ⲛ̀-",
        pronominal: "ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        id: "cd_947",
        nominal: "ⲛ̀-",
        pronominal: "ⲛⲁ=",
        etymology: "Egy",
      },
      {
        id: "cd_1173",
        nominal: "ⲛ̀ⲧⲉ-",
        pronominal: "ⲛ̀ⲧⲁ=",
        etymology: "Egy",
      },
      {
        id: "cd_1713",
        nominal: "ⲟⲩⲧⲉ-",
        pronominal: "ⲟⲩⲧⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲕⲁⲧⲁ-",
        nominal: "ⲕⲁⲧⲁ-",
        pronominal: "ⲕⲁⲧⲁⲣⲟ=",
        etymology: "Gr",
      },
      {
        headword: "ϩⲱⲥ-",
        nominal: "ϩⲱⲥ-",
        pronominal: "",
        etymology: "Gr",
      },
      {
        headword: "ⲙⲉⲛⲉⲛⲥⲁ-",
        nominal: "ⲙⲉⲛⲉⲛⲥⲁ-",
        pronominal: "ⲙⲉⲛⲉⲛⲥⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ⳳⲉⲛ-",
        nominal: "ⲉ̀ⲃⲟⲗ ⳳⲉⲛ-",
        pronominal: "ⲉ̀ⲃⲟⲗ ⲛ̀ⳳⲏⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲉⲛ-",
        nominal: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲉⲛ-",
        pronominal: "ⲉ̀ⲃⲟⲗ ϩⲓⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ⲃⲟⲗ ⲛ̀-",
        nominal: "ⲉ̀ⲃⲟⲗ ⲛ̀-",
        pronominal: "ⲉ̀ⲃⲟⲗ ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⲥⲁ-",
        nominal: "ⲛ̀ⲥⲁ-",
        pronominal: "ⲛ̀ⲥⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϫⲉⲛ-",
        nominal: "ⲉ̀ϫⲉⲛ-",
        pronominal: "ⲉ̀ϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓϫⲉⲛ-",
        nominal: "ϩⲓϫⲉⲛ-",
        pronominal: "ϩⲓϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲉⲛ-",
        nominal: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲉⲛ-",
        pronominal: "ⲉ̀ϩ̀ⲣⲏⲓ ⲉ̀ϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲉⲛ-",
        nominal: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲉⲛ-",
        pronominal: "ⲉ̀ϩ̀ⲣⲏⲓ ϩⲓϫⲱ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⳳ̀ⲣⲏⲓ ⳳⲉⲛ-",
        nominal: "ⲛ̀ⳳ̀ⲣⲏⲓ ⳳⲉⲛ-",
        pronominal: "ⲛ̀ⳳ̀ⲣⲏⲓ ⲛ̀ⳳⲏⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛⲁϩ̀ⲣⲉⲛ-",
        nominal: "ⲛⲁϩ̀ⲣⲉⲛ-",
        pronominal: "ⲛⲁϩ̀ⲣⲁ=",
        etymology: "Egy",
      },
      {
        headword: "ⳳⲁⲧⲉⲛ-",
        nominal: "ⳳⲁⲧⲉⲛ-",
        pronominal: "ⳳⲁⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ⲛ̀ⲧⲉⲛ-",
        nominal: "ⲛ̀ⲧⲉⲛ-",
        pronominal: "ⲛ̀ⲧⲟⲧ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓⲫⲁϩⲟⲩ ⲛ̀-",
        nominal: "ϩⲓⲫⲁϩⲟⲩ ⲛ̀-",
        pronominal: "ϩⲓⲫⲁϩⲟⲩ ⲙ̀ⲙⲟ=",
        etymology: "Egy",
      },
      {
        headword: "ϩⲓⲧⲉⲛ-",
        nominal: "ϩⲓⲧⲉⲛ-",
        pronominal: "ϩⲓⲧⲟⲧ=",
        etymology: "Egy",
      },
    ] as const;

    for (const expected of boundOnlyEntries) {
      const entry =
        "id" in expected
          ? dictionary.find((candidate) => candidate.id === expected.id)
          : dictionary.find(
              (candidate) => candidate.headword === expected.headword,
            );

      expect(entry).toBeDefined();
      expect(entry?.dialects.B).toMatchObject({
        absolute: "",
        nominal: expected.nominal,
        pronominal: expected.pronominal,
      });
      expect(entry?.etymology).toBe(expected.etymology);
    }
  });
});
