import { describe, expect, it } from "vitest";

import {
  DEFAULT_DICTIONARY_FLASHCARD_DECK_FILTERS,
  filterDictionaryFlashcardDeckItems,
  getDictionaryFlashcardDeckFilterOptions,
  hasActiveDictionaryFlashcardDeckFilters,
} from "@/features/practice/lib/deckFilters";
import type { DictionaryFlashcardDeckItem } from "@/features/practice/lib/dictionaryDecks";

function createItem(
  overrides: {
    dialect?: string | null;
    grammar?: string;
    template?: "coptic_to_meaning" | "coptic_to_part_of_speech";
  } = {},
): DictionaryFlashcardDeckItem {
  const grammar = overrides.grammar ?? "N";

  return {
    candidate: {
      displayDialect: overrides.dialect ?? "B",
      metadata: {
        partOfSpeech: grammar,
        partOfSpeechCode: grammar.toLocaleLowerCase(),
        partOfSpeechLabelKey: grammar === "V" ? "dict.verb" : "dict.noun",
        templateLabelKey:
          overrides.template === "coptic_to_part_of_speech"
            ? "practice.template.copticToPartOfSpeech"
            : "practice.template.copticToMeaning",
      },
      selectedDialect: "B",
      sourceType: "dictionary",
      template: overrides.template ?? "coptic_to_meaning",
    },
  } as DictionaryFlashcardDeckItem;
}

describe("flashcard deck filters", () => {
  it("builds filter options from deck items", () => {
    const options = getDictionaryFlashcardDeckFilterOptions([
      createItem(),
      createItem({ dialect: "S", grammar: "V" }),
      createItem({ template: "coptic_to_part_of_speech" }),
    ]);

    expect(options.cardTypes.map((option) => option.value)).toEqual([
      "coptic_to_meaning",
      "coptic_to_part_of_speech",
    ]);
    expect(options.dialects).toMatchObject([
      { count: 2, value: "B" },
      { count: 1, value: "S" },
    ]);
    expect(options.grammars.map((option) => option.value)).toEqual(["N", "V"]);
    expect(options.sources).toMatchObject([{ count: 3, value: "dictionary" }]);
  });

  it("filters by card type, dialect, and grammar", () => {
    const noun = createItem();
    const verb = createItem({ dialect: "S", grammar: "V" });
    const grammar = createItem({ template: "coptic_to_part_of_speech" });

    expect(
      filterDictionaryFlashcardDeckItems({
        filters: {
          cardType: "coptic_to_meaning",
          dialect: "S",
          grammar: "V",
          source: "all",
        },
        items: [noun, verb, grammar],
      }),
    ).toEqual([verb]);
  });

  it("detects active filters", () => {
    expect(
      hasActiveDictionaryFlashcardDeckFilters(
        DEFAULT_DICTIONARY_FLASHCARD_DECK_FILTERS,
      ),
    ).toBe(false);
    expect(
      hasActiveDictionaryFlashcardDeckFilters({
        ...DEFAULT_DICTIONARY_FLASHCARD_DECK_FILTERS,
        grammar: "N",
      }),
    ).toBe(true);
  });
});
