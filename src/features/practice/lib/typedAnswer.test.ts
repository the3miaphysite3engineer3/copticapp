import { describe, expect, it } from "vitest";

import {
  compareTypedFlashcardAnswer,
  normalizeTypedFlashcardAnswer,
} from "@/features/practice/lib/typedAnswer";

describe("typed flashcard answers", () => {
  it("normalizes spacing and punctuation", () => {
    expect(normalizeTypedFlashcardAnswer(" ⲥⲱⲧⲙ, ")).toBe("ⲥⲱⲧⲙ");
    expect(normalizeTypedFlashcardAnswer("ⲥ ⲱ ⲧ ⲙ")).toBe("ⲥⲱⲧⲙ");
  });

  it("ignores dictionary separators and editorial marks", () => {
    expect(normalizeTypedFlashcardAnswer("ϯ-/ⲧⲁ(ⲁ)= ⲧⲟ† ⲧⲁⲓ̈~")).toBe(
      "ϯⲧⲁⲁⲧⲟⲧⲁⲓ",
    );
  });

  it("normalizes case and common combining marks", () => {
    expect(normalizeTypedFlashcardAnswer("Ⲁ̄ⲄⲀⲠⲎ")).toBe("ⲁⲅⲁⲡⲏ");
  });

  it("accepts a normalized match", () => {
    expect(
      compareTypedFlashcardAnswer({
        expected: "ⲥⲱⲧⲙ",
        input: " ⲤⲰⲦⲘ ",
      }),
    ).toBe("correct");
  });

  it("reports empty and incorrect answers", () => {
    expect(
      compareTypedFlashcardAnswer({
        expected: "ⲥⲱⲧⲙ",
        input: " ",
      }),
    ).toBe("empty");
    expect(
      compareTypedFlashcardAnswer({
        expected: "ⲥⲱⲧⲙ",
        input: "ⲣⲱⲙⲉ",
      }),
    ).toBe("incorrect");
  });
});
