import { describe, expect, it } from "vitest";

import { getPublishedGrammarLessonBundleBySlug } from "@/features/grammar/lib/grammarDataset";
import {
  buildGeneratedGrammarFlashcardSources,
  buildGrammarFlashcardCandidateByIdentity,
} from "@/features/practice/lib/grammarFlashcards";

describe("grammar flashcards", () => {
  it("builds grammar candidates from lesson flashcard seeds", () => {
    const lesson = getPublishedGrammarLessonBundleBySlug("lesson-1");

    expect(lesson).not.toBeNull();

    const sources = buildGeneratedGrammarFlashcardSources({
      deckId: "grammar-lesson-1",
      language: "en",
      lessons: lesson ? [lesson] : [],
    });

    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0]?.candidate).toMatchObject({
      language: "en",
      sourceType: "grammar",
      template: "grammar_concept_to_definition",
      variantKey: "default",
    });
    expect(sources[0]?.candidate.links?.[0]).toMatchObject({
      href: "/en/grammar/lesson-1",
      labelKey: "practice.saved.openLesson",
    });
  });

  it("resolves a persisted grammar identity back to its candidate", () => {
    const candidate = buildGrammarFlashcardCandidateByIdentity({
      language: "en",
      sourceId: "grammar.flashcard.lesson01.nominal-sentence.they-are-men",
      template: "grammar_translation_to_coptic",
      variantKey: "default",
    });

    expect(candidate).toMatchObject({
      back: {
        kind: "coptic",
        text: "Ϩⲁⲛⲣⲱⲙⲓ ⲛⲉ.",
      },
      front: {
        kind: "meaning",
        text: "They are men.",
      },
      sourceType: "grammar",
    });
  });
});
