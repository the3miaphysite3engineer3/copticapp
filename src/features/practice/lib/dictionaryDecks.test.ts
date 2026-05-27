import { describe, expect, it } from "vitest";

import type { LexicalEntry } from "@/features/dictionary/types";
import {
  buildDictionaryFlashcardsDeckReadModel,
  buildGeneratedDictionaryFlashcardSources,
  getDictionaryFlashcardDeckDefinition,
  isDictionaryFlashcardDeckId,
  toDictionaryFlashcardDeckSummary,
} from "@/features/practice/lib/dictionaryDecks";
import type { DictionaryFlashcardRow } from "@/features/practice/types";

function createEntry(overrides: Partial<LexicalEntry> = {}): LexicalEntry {
  return {
    dialects: {
      S: {
        absolute: "ⲣⲱⲙⲉ",
      },
    },
    etym: "Egy",
    headword: "ⲣⲱⲙⲉ",
    id: 10,
    senses: [
      {
        grammar: { gender: "M", pos: "N" },
        meanings: {
          en: ["man"],
          nl: ["man"],
        },
      },
    ],
    ...overrides,
  };
}

function createFlashcardRow(
  overrides: Partial<DictionaryFlashcardRow> = {},
): DictionaryFlashcardRow {
  return {
    created_at: "2026-05-26T10:00:00.000Z",
    display_dialect: "B",
    due_at: "2026-05-26T09:00:00.000Z",
    id: "flashcard-10",
    locale: "en",
    scheduler_card: {},
    source_id: "10",
    source_type: "dictionary",
    suspended_at: null,
    template: "coptic_to_meaning",
    updated_at: "2026-05-26T10:00:00.000Z",
    user_id: "user-123",
    variant_key: "B",
    ...overrides,
  };
}

describe("dictionary flashcard decks", () => {
  it("narrows supported deck ids", () => {
    expect(isDictionaryFlashcardDeckId("saved-entries")).toBe(true);
    expect(isDictionaryFlashcardDeckId("bohairic-nouns")).toBe(true);
    expect(isDictionaryFlashcardDeckId("bohairic-verbs")).toBe(true);
    expect(isDictionaryFlashcardDeckId("sahidic-nouns")).toBe(true);
    expect(isDictionaryFlashcardDeckId("greek-loanwords")).toBe(true);
    expect(isDictionaryFlashcardDeckId("unknown")).toBe(false);
  });

  it("keeps a readable scope label for broad generated decks", () => {
    expect(
      toDictionaryFlashcardDeckSummary(
        getDictionaryFlashcardDeckDefinition("greek-loanwords"),
      ).scopeLabelKey,
    ).toBe("practice.deckScope.greekOrigin");
  });

  it("builds generated deck sources from dictionary predicates", () => {
    const bohairicNoun = createEntry({
      dialects: { B: { absolute: "ⲣⲱⲙⲓ" } },
      id: 10,
    });
    const sahidicVerb = createEntry({
      id: 11,
      senses: [
        {
          grammar: { pos: "V" },
          meanings: {
            en: ["hear"],
            nl: ["horen"],
          },
        },
      ],
    });
    const mixedPrimaryNounWithVerb = createEntry({
      id: 13,
      senses: [
        {
          grammar: { gender: "M", pos: "N" },
          meanings: {
            en: ["fight"],
            nl: ["strijd"],
          },
        },
        {
          grammar: { pos: "V" },
          meanings: {
            en: ["fight"],
            nl: ["strijden"],
          },
        },
      ],
    });
    const greekLoanword = createEntry({
      etym: "Gr",
      id: 12,
      headword: "ⲁⲅⲅⲉⲗⲟⲥ",
    });

    const bohairicSources = buildGeneratedDictionaryFlashcardSources({
      deckId: "bohairic-nouns",
      dictionary: [bohairicNoun, sahidicVerb, greekLoanword],
      language: "en",
    });
    const sahidicSources = buildGeneratedDictionaryFlashcardSources({
      deckId: "sahidic-verbs",
      dictionary: [
        bohairicNoun,
        sahidicVerb,
        greekLoanword,
        mixedPrimaryNounWithVerb,
      ],
      language: "en",
    });
    const greekSources = buildGeneratedDictionaryFlashcardSources({
      deckId: "greek-loanwords",
      dictionary: [bohairicNoun, sahidicVerb, greekLoanword],
      language: "en",
    });

    expect(bohairicSources.map(({ candidate }) => candidate.entryId)).toEqual([
      10, 10, 10,
    ]);
    expect(bohairicSources.map(({ candidate }) => candidate.template)).toEqual([
      "coptic_to_meaning",
      "meaning_to_coptic",
      "coptic_to_part_of_speech",
    ]);
    expect(bohairicSources[0]?.candidate.selectedDialect).toBe("B");
    expect(sahidicSources.map(({ candidate }) => candidate.entryId)).toEqual([
      11, 11, 11,
    ]);
    expect(
      sahidicSources.every(
        ({ candidate }) => candidate.metadata.partOfSpeech === "V",
      ),
    ).toBe(true);
    expect(sahidicSources[0]?.candidate.selectedDialect).toBe("S");
    expect(greekSources.map(({ candidate }) => candidate.entryId)).toEqual([
      12, 12, 12,
    ]);
  });

  it("joins generated sources to existing scheduler rows", () => {
    const candidateSources = buildGeneratedDictionaryFlashcardSources({
      deckId: "bohairic-nouns",
      dictionary: [
        createEntry({ dialects: { B: { absolute: "ⲣⲱⲙⲓ" } }, id: 10 }),
        createEntry({
          dialects: { B: { absolute: "ϣⲏⲣⲓ" } },
          headword: "ϣⲏⲣⲓ",
          id: 11,
        }),
      ],
      language: "en",
    });

    const deck = buildDictionaryFlashcardsDeckReadModel({
      candidateSources,
      existingFlashcards: [
        createFlashcardRow({
          due_at: "2026-05-26T09:00:00.000Z",
          id: "due-card",
          source_id: "10",
        }),
      ],
      now: new Date("2026-05-26T12:00:00.000Z"),
    });

    expect(deck.queue.slice(0, 2).map((item) => item.flashcardId)).toEqual([
      "due-card",
      null,
    ]);
    expect(deck.stats).toMatchObject({
      availableCards: 6,
      dueCards: 1,
      newCards: 5,
      totalSourceEntries: 6,
    });
  });
});
