import { describe, expect, it } from "vitest";

import { listDictionaryEntries } from "@/features/dictionary/lib/dictionary";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import {
  MIXED_FLASHCARD_DECK_ID,
  buildFlashcardDeckOptions,
  buildGeneratedFlashcardSourcesByDeckId,
  isFlashcardDeckId,
} from "@/features/practice/lib/deckRegistry";

function listPublishedGrammarLessonBundles() {
  return listPublishedGrammarLessons()
    .map((lesson) => getPublishedGrammarLessonBundleBySlug(lesson.slug))
    .filter((lesson) => lesson !== null);
}

describe("flashcard deck registry", () => {
  it("recognizes dictionary, grammar, and mixed deck ids", () => {
    expect(isFlashcardDeckId("bohairic-nouns")).toBe(true);
    expect(isFlashcardDeckId("grammar-lesson-1")).toBe(true);
    expect(isFlashcardDeckId(MIXED_FLASHCARD_DECK_ID)).toBe(true);
    expect(isFlashcardDeckId("unknown-deck")).toBe(false);
  });

  it("builds a mixed deck from dictionary and grammar sources", () => {
    const sourcesByDeckId = buildGeneratedFlashcardSourcesByDeckId({
      context: {
        dictionary: {
          entries: listDictionaryEntries(),
        },
        grammar: {
          lessons: listPublishedGrammarLessonBundles(),
        },
      },
      language: "en",
    });
    const mixedSources = sourcesByDeckId.get(MIXED_FLASHCARD_DECK_ID) ?? [];

    expect(
      new Set(mixedSources.map((source) => source.candidate.sourceType)),
    ).toEqual(new Set(["dictionary", "grammar"]));
  });

  it("places the mixed deck in the deck picker with a source count", () => {
    const options = buildFlashcardDeckOptions({
      getSourceCount: (deckId) => (deckId === MIXED_FLASHCARD_DECK_ID ? 88 : 1),
    });

    expect(options.map((option) => option.id).slice(0, 2)).toEqual([
      "saved-entries",
      MIXED_FLASHCARD_DECK_ID,
    ]);
    expect(
      options.find((option) => option.id === MIXED_FLASHCARD_DECK_ID),
    ).toMatchObject({
      kind: "mixed",
      sourceCount: 88,
    });
  });
});
