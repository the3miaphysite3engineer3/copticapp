import { describe, expect, it } from "vitest";

import type { DictionaryFlashcardDeckItem } from "@/features/practice/lib/dictionaryDecks";
import {
  getDefaultFlashcardStudyMode,
  getFlashcardStudyModeCounts,
  getFlashcardStudyModeItems,
  getFlashcardWeakReviewScore,
  getInitialFlashcardStudyMode,
  isWeakFlashcardRating,
  normalizeFlashcardStudyMode,
} from "@/features/practice/lib/studyFlow";

function createItem(
  overrides: Partial<DictionaryFlashcardDeckItem> = {},
): DictionaryFlashcardDeckItem {
  return {
    candidate: {
      id: "candidate-1",
    },
    dueAt: null,
    flashcardId: null,
    lastReviewRating: null,
    lastReviewedAt: null,
    recentReviewRatings: [],
    sourceCreatedAt: null,
    status: "new",
    ...overrides,
  } as DictionaryFlashcardDeckItem;
}

describe("flashcard study flow", () => {
  it("normalizes supported study modes", () => {
    expect(normalizeFlashcardStudyMode("review")).toBe("review");
    expect(normalizeFlashcardStudyMode("learn")).toBe("learn");
    expect(normalizeFlashcardStudyMode("weak")).toBe("weak");
    expect(normalizeFlashcardStudyMode("all")).toBeNull();
  });

  it("prefers due cards, then new cards, for the default mode", () => {
    expect(getDefaultFlashcardStudyMode({ learn: 3, review: 2, weak: 0 })).toBe(
      "review",
    );
    expect(getDefaultFlashcardStudyMode({ learn: 3, review: 0, weak: 1 })).toBe(
      "learn",
    );
    expect(getDefaultFlashcardStudyMode({ learn: 0, review: 0, weak: 1 })).toBe(
      "weak",
    );
  });

  it("falls back when a requested mode has no cards", () => {
    expect(
      getInitialFlashcardStudyMode({
        counts: { learn: 4, review: 0, weak: 0 },
        requestedMode: "review",
      }),
    ).toBe("learn");
    expect(
      getInitialFlashcardStudyMode({
        counts: { learn: 4, review: 0, weak: 0 },
        requestedMode: "learn",
      }),
    ).toBe("learn");
  });

  it("counts and filters weak cards from recent review history", () => {
    const items = [
      createItem({
        candidate: { id: "due" } as DictionaryFlashcardDeckItem["candidate"],
        status: "due",
      }),
      createItem({
        candidate: { id: "new" } as DictionaryFlashcardDeckItem["candidate"],
        status: "new",
      }),
      createItem({
        candidate: {
          id: "weak-again",
        } as DictionaryFlashcardDeckItem["candidate"],
        lastReviewRating: "again",
        status: "scheduled",
      }),
      createItem({
        candidate: {
          id: "weak-hard",
        } as DictionaryFlashcardDeckItem["candidate"],
        lastReviewRating: "hard",
        recentReviewRatings: ["good", "again"],
        status: "scheduled",
      }),
      createItem({
        candidate: {
          id: "recovered-hard",
        } as DictionaryFlashcardDeckItem["candidate"],
        lastReviewRating: "good",
        recentReviewRatings: ["good", "hard"],
        status: "scheduled",
      }),
    ];

    expect(isWeakFlashcardRating("again")).toBe(true);
    expect(isWeakFlashcardRating("hard")).toBe(true);
    expect(isWeakFlashcardRating("good")).toBe(false);
    expect(getFlashcardWeakReviewScore(items[2])).toBe(2);
    expect(getFlashcardWeakReviewScore(items[3])).toBe(1);
    expect(getFlashcardWeakReviewScore(items[4])).toBe(0);
    expect(getFlashcardStudyModeCounts(items)).toEqual({
      learn: 1,
      review: 1,
      weak: 2,
    });
    expect(
      getFlashcardStudyModeItems({ items, mode: "weak" }).map(
        (item) => item.candidate.id,
      ),
    ).toEqual(["weak-again", "weak-hard"]);
  });
});
