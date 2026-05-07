import { describe, expect, it } from "vitest";

import { buildEntryDescription } from "@/features/dictionary/lib/entryText";
import type { LexicalEntry } from "@/features/dictionary/types";

const fallbackEntry: LexicalEntry = {
  id: "cd_test",
  headword: "ϭⲱⲓⲥ",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  pos: "N",
  gender: "",
  english_meanings: [""],
  greek_equivalents: [],
};

describe("entry descriptions", () => {
  it("falls back to product-first wording in English", () => {
    expect(buildEntryDescription(fallbackEntry, "en")).toBe(
      "ϭⲱⲓⲥ (Noun) in the Coptic dictionary on Coptic Compass.",
    );
  });

  it("falls back to product-first wording in Dutch", () => {
    expect(buildEntryDescription(fallbackEntry, "nl")).toBe(
      "ϭⲱⲓⲥ (Zelfstandig naamwoord) in het Koptische woordenboek van Coptic Compass.",
    );
  });
});
