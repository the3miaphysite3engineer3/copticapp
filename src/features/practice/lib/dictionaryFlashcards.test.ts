import { describe, expect, it } from "vitest";

import type { LexicalEntry } from "@/features/dictionary/types";
import {
  DEFAULT_DICTIONARY_FLASHCARD_TEMPLATES,
  buildDictionaryFlashcardCandidate,
  buildDictionaryFlashcardCandidates,
  getDictionaryFlashcardCandidateId,
} from "@/features/practice/lib/dictionaryFlashcards";

function createEntry(overrides: Partial<LexicalEntry> = {}): LexicalEntry {
  return {
    id: 10,
    headword: "ⲣⲱⲙⲉ",
    dialects: {
      B: {
        absolute: "ⲣⲱⲙⲓ",
      },
    },
    etym: "Egy",
    senses: [
      {
        grammar: { gender: "M", pos: "N" },
        meanings: {
          en: ["man", "human being", "<i>person</i>"],
          nl: ["mens", "persoon"],
        },
      },
    ],
    ...overrides,
  };
}

describe("dictionary flashcard derivation", () => {
  it("builds a Coptic-to-meaning candidate from a dictionary entry", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry(),
      language: "en",
      selectedDialect: "B",
    });

    expect(candidate).toMatchObject({
      id: "dictionary:10:coptic_to_meaning:en:B",
      source: "dictionary",
      template: "coptic_to_meaning",
      entryId: 10,
      entryPath: "/en/entry/10",
      selectedDialect: "B",
      displayDialect: "B",
      front: {
        kind: "coptic",
        labelKey: "practice.side.coptic",
        text: "ⲣⲱⲙⲓ",
      },
      back: {
        kind: "meaning",
        labelKey: "practice.side.meaning",
        meanings: ["man", "human being", "person"],
        text: "man; human being; person",
      },
      metadata: {
        canSpeak: true,
        copticText: "ⲣⲱⲙⲓ",
        grammarText: "Noun (n), Masculine",
        headword: "ⲣⲱⲙⲉ",
        partOfSpeech: "N",
        partOfSpeechCode: "n",
        partOfSpeechLabelKey: "dict.noun",
        speechText: "ⲣⲱⲙⲓ",
        answerSpeechText: null,
        templateLabelKey: "practice.template.copticToMeaning",
      },
    });
  });

  it("localizes the back of the card", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry(),
      language: "nl",
      selectedDialect: "B",
    });

    expect(candidate?.back).toMatchObject({
      meanings: ["mens", "persoon"],
      text: "mens; persoon",
    });
    expect(candidate?.entryPath).toBe("/nl/entry/10");
  });

  it("builds a meaning-to-Coptic reverse card", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry(),
      language: "en",
      selectedDialect: "B",
      template: "meaning_to_coptic",
    });

    expect(candidate).toMatchObject({
      id: "dictionary:10:meaning_to_coptic:en:B",
      template: "meaning_to_coptic",
      front: {
        kind: "meaning",
        labelKey: "practice.side.meaning",
        text: "man; human being; person",
      },
      back: {
        kind: "coptic",
        labelKey: "practice.side.coptic",
        text: "ⲣⲱⲙⲓ",
      },
      metadata: {
        speechText: null,
        answerSpeechText: "ⲣⲱⲙⲓ",
        templateLabelKey: "practice.template.meaningToCoptic",
      },
    });
  });

  it("builds a Coptic-to-part-of-speech card", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry(),
      language: "nl",
      selectedDialect: "B",
      template: "coptic_to_part_of_speech",
    });

    expect(candidate).toMatchObject({
      id: "dictionary:10:coptic_to_part_of_speech:nl:B",
      template: "coptic_to_part_of_speech",
      front: {
        kind: "coptic",
        text: "ⲣⲱⲙⲓ",
      },
      back: {
        kind: "grammar",
        labelKey: "practice.side.partOfSpeech",
        text: "Zelfstandig naamwoord (n), Mannelijk",
      },
      metadata: {
        answerSpeechText: null,
        grammarText: "Zelfstandig naamwoord (n), Mannelijk",
        partOfSpeechLabelKey: "dict.noun",
        speechText: "ⲣⲱⲙⲓ",
        templateLabelKey: "practice.template.copticToPartOfSpeech",
      },
    });
  });

  it("honors the selected dialect when the entry has that form", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry({
        dialects: {
          B: {
            absolute: "ⲣⲱⲙⲓ",
          },
          S: {
            absolute: "ⲣⲱⲙⲉ",
          },
        },
      }),
      language: "en",
      selectedDialect: "S",
    });

    expect(candidate?.front.text).toBe("ⲣⲱⲙⲉ");
    expect(candidate?.displayDialect).toBe("S");
    expect(candidate?.metadata.copticText).toBe("ⲣⲱⲙⲉ");
    expect(candidate?.metadata.canSpeak).toBe(false);
    expect(candidate?.metadata.speechText).toBeNull();
  });

  it("falls back to an available dialect when the selected dialect is missing", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry(),
      language: "en",
      selectedDialect: "S",
    });

    expect(candidate?.front.text).toBe("ⲣⲱⲙⲓ");
    expect(candidate?.displayDialect).toBe("B");
    expect(candidate?.metadata.copticText).toBe("ⲣⲱⲙⲓ");
  });

  it("limits and de-duplicates meaning values after text normalization", () => {
    const candidate = buildDictionaryFlashcardCandidate({
      entry: createEntry({
        senses: [
          {
            grammar: { pos: "V", valency: "TR" },
            meanings: {
              en: ["<b>open</b>", "open", "be open", "reveal"],
            },
          },
        ],
      }),
      language: "en",
      meaningLimit: 2,
    });

    expect(candidate?.back).toMatchObject({
      meanings: ["open", "be open"],
      text: "open; be open",
    });
    expect(candidate?.metadata.partOfSpeech).toBe("V");
    expect(candidate?.metadata.partOfSpeechCode).toBe("v");
    expect(candidate?.metadata.grammarText).toBe("Verb (v), Transitive");
  });

  it("skips entries that cannot produce a useful back", () => {
    expect(
      buildDictionaryFlashcardCandidate({
        entry: createEntry({
          senses: [{ grammar: { pos: "N" } }],
        }),
        language: "en",
      }),
    ).toBeNull();
  });

  it("skips entries that cannot produce a useful front", () => {
    expect(
      buildDictionaryFlashcardCandidate({
        entry: createEntry({
          dialects: {},
          headword: "",
        }),
        language: "en",
      }),
    ).toBeNull();
  });

  it("filters invalid candidates when building from multiple entries", () => {
    const candidates = buildDictionaryFlashcardCandidates({
      entries: [
        createEntry({ id: 1, headword: "ⲟⲩⲟⲉⲓⲛ" }),
        createEntry({
          id: 2,
          headword: "ϭⲱⲓⲥ",
          senses: [{ grammar: { pos: "N" } }],
        }),
        createEntry({ id: 3, headword: "ϯ" }),
      ],
      language: "en",
      selectedDialect: "B",
    });

    expect(candidates.map((candidate) => candidate.entryId)).toEqual([1, 3]);
  });

  it("builds all default advanced templates when requested", () => {
    const candidates = buildDictionaryFlashcardCandidates({
      entries: [createEntry()],
      language: "en",
      selectedDialect: "B",
      templates: DEFAULT_DICTIONARY_FLASHCARD_TEMPLATES,
    });

    expect(candidates.map((candidate) => candidate.template)).toEqual([
      "coptic_to_meaning",
      "meaning_to_coptic",
      "coptic_to_part_of_speech",
    ]);
  });

  it("builds stable candidate ids without needing the entry object", () => {
    expect(
      getDictionaryFlashcardCandidateId({
        entryId: 20,
        language: "nl",
        selectedDialect: "B",
        template: "meaning_to_coptic",
      }),
    ).toBe("dictionary:20:meaning_to_coptic:nl:B");
  });
});
