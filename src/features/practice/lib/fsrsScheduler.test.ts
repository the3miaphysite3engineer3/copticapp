import { describe, expect, it } from "vitest";

import {
  createInitialFlashcardSchedulerState,
  isFlashcardReviewRating,
  parseSerializedFsrsCard,
  reviewFlashcardSchedulerState,
} from "@/features/practice/lib/fsrsScheduler";

describe("FSRS flashcard scheduler adapter", () => {
  it("creates a serializable initial scheduler card", () => {
    const now = new Date("2026-05-26T10:00:00.000Z");
    const state = createInitialFlashcardSchedulerState(now);

    expect(state).toMatchObject({
      dueAt: "2026-05-26T10:00:00.000Z",
      card: {
        due: "2026-05-26T10:00:00.000Z",
        reps: 0,
        lapses: 0,
        state: 0,
      },
    });
    expect(JSON.parse(JSON.stringify(state.card))).toEqual(state.card);
  });

  it("reviews a card with an Anki-style rating and returns the next state", () => {
    const initial = createInitialFlashcardSchedulerState(
      new Date("2026-05-26T10:00:00.000Z"),
    );
    const result = reviewFlashcardSchedulerState(
      initial.card,
      "good",
      new Date("2026-05-26T10:05:00.000Z"),
    );

    expect(result.reviewedAt).toBe("2026-05-26T10:05:00.000Z");
    expect(result.card.reps).toBe(1);
    expect(result.card.due).toBe(result.dueAt);
    expect(result.log.rating).toBe(3);
    expect(result.log.review).toBe(result.reviewedAt);
    expect(parseSerializedFsrsCard(result.card)).toEqual(result.card);
  });

  it("recognizes only supported review ratings", () => {
    expect(isFlashcardReviewRating("again")).toBe(true);
    expect(isFlashcardReviewRating("hard")).toBe(true);
    expect(isFlashcardReviewRating("good")).toBe(true);
    expect(isFlashcardReviewRating("easy")).toBe(true);
    expect(isFlashcardReviewRating("manual")).toBe(false);
  });

  it("rejects invalid stored scheduler cards", () => {
    expect(parseSerializedFsrsCard(null)).toBeNull();
    expect(parseSerializedFsrsCard({ due: "not-a-date" })).toBeNull();
    expect(() =>
      reviewFlashcardSchedulerState({ due: "not-a-date" }, "good"),
    ).toThrow("Invalid flashcard scheduler state.");
  });
});
