import { describe, expect, it } from "vitest";

import type { EntryFavoriteWithEntry } from "@/features/dictionary/lib/entryActions";
import type { LexicalEntry } from "@/features/dictionary/types";
import { buildSavedEntriesPracticeReadModel } from "@/features/practice/lib/savedEntriesDeck";
import type { DictionaryFlashcardRow } from "@/features/practice/types";

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
          en: ["man"],
          nl: ["mens"],
        },
      },
    ],
    ...overrides,
  };
}

function createFavorite(
  entry: LexicalEntry | null,
  createdAt = "2026-05-26T10:00:00.000Z",
): EntryFavoriteWithEntry {
  return {
    entry,
    favorite: {
      created_at: createdAt,
      entry_id: entry ? String(entry.id) : "missing",
      user_id: "user-123",
    },
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

describe("saved entries flashcards read model", () => {
  it("queues due saved-entry cards before new cards", () => {
    const dueEntry = createEntry({ id: 10, headword: "ⲣⲱⲙⲉ" });
    const newEntry = createEntry({ id: 11, headword: "ϣⲏⲣⲓ" });
    const scheduledEntry = createEntry({ id: 12, headword: "ⲏⲓ" });
    const deck = buildSavedEntriesPracticeReadModel({
      existingFlashcards: [
        createFlashcardRow({
          due_at: "2026-05-26T09:00:00.000Z",
          id: "due-card",
          source_id: "10",
        }),
        createFlashcardRow({
          due_at: "2026-05-27T09:00:00.000Z",
          id: "scheduled-card",
          source_id: "12",
        }),
      ],
      favorites: [
        createFavorite(newEntry, "2026-05-26T10:00:00.000Z"),
        createFavorite(scheduledEntry, "2026-05-26T10:01:00.000Z"),
        createFavorite(dueEntry, "2026-05-26T10:02:00.000Z"),
      ],
      language: "en",
      now: new Date("2026-05-26T12:00:00.000Z"),
      preferredDialect: "B",
      queueLimit: 2,
    });

    expect(deck.queue.map((item) => item.flashcardId)).toEqual([
      "due-card",
      null,
    ]);
    expect(deck.queue.map((item) => item.status)).toEqual(["due", "new"]);
    expect(deck.nextDueAt).toBe("2026-05-27T09:00:00.000Z");
    expect(deck.stats).toMatchObject({
      availableCards: 9,
      dueCards: 1,
      newCards: 7,
      scheduledCards: 1,
      totalSourceEntries: 3,
    });
  });

  it("counts missing and unusable saved entries", () => {
    const unusableEntry = createEntry({
      id: 20,
      senses: [{ grammar: { pos: "UNKNOWN" } }],
    });
    const deck = buildSavedEntriesPracticeReadModel({
      existingFlashcards: [],
      favorites: [createFavorite(null), createFavorite(unusableEntry)],
      language: "en",
      now: new Date("2026-05-26T12:00:00.000Z"),
      preferredDialect: "B",
    });

    expect(deck.items).toEqual([]);
    expect(deck.queue).toEqual([]);
    expect(deck.stats).toMatchObject({
      availableCards: 0,
      missingEntries: 2,
      totalSourceEntries: 2,
    });
  });
});
