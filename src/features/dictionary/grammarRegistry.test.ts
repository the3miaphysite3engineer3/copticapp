import { describe, expect, it } from "vitest";

import {
  DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS,
  getGrammarAbbreviationTooltips,
  getPartOfSpeechDisplayCode,
  getPartOfSpeechLabelKey,
  INLINE_GRAMMAR_ABBREVIATION_PATTERNS,
  LEADING_GRAMMAR_LABEL_PATTERNS,
  isVerbPartOfSpeech,
  normalizePartOfSpeechCode,
} from "./grammarRegistry";

describe("dictionary grammar registry", () => {
  it("normalizes supported part-of-speech codes", () => {
    expect(normalizePartOfSpeechCode("V")).toBe("V");
    expect(normalizePartOfSpeechCode("intj")).toBe("INTJ");
    expect(normalizePartOfSpeechCode("not-a-pos")).toBe("UNKNOWN");
  });

  it("returns compact display codes from the current dictionary registry", () => {
    expect(getPartOfSpeechDisplayCode("V")).toBe("v");
    expect(getPartOfSpeechDisplayCode("INTJ")).toBe("intj");
    expect(getPartOfSpeechDisplayCode("UNKNOWN")).toBe("");
    expect(isVerbPartOfSpeech("V")).toBe(true);
    expect(isVerbPartOfSpeech("v")).toBe(true);
    expect(isVerbPartOfSpeech("VB")).toBe(false);
  });

  it("keeps labels and grammar abbreviation tooltips in one map", () => {
    const translate = (key: string) => `translated:${key}`;
    const tooltips = getGrammarAbbreviationTooltips(translate);

    expect(getPartOfSpeechLabelKey("V")).toBe("dict.verb");
    expect(tooltips.tr).toBe("translated:entry.abbreviation.tr");
    expect(tooltips.intr).toBe("translated:entry.abbreviation.intr");
    expect(tooltips.dat).toBe("translated:entry.abbreviation.dat");
    expect(tooltips.aux).toBe("translated:entry.abbreviation.aux");
    expect(tooltips.gk).toBe("translated:entry.abbreviation.gk");
    expect(tooltips.n).toBe("translated:entry.abbreviation.n");
    expect(tooltips.pfx).toBe("translated:entry.abbreviation.pfx");
    expect(tooltips.sbj).toBe("translated:entry.abbreviation.sbj");
    expect(tooltips.sfx).toBe("translated:entry.abbreviation.sfx");
    expect(tooltips["ethic dat"]).toBe(
      "translated:entry.abbreviation.ethicDat",
    );
    expect(tooltips["impers v"]).toBe(
      "translated:entry.abbreviation.impersVerb",
    );
    expect(tooltips.pc).toBe("translated:entry.abbreviation.pc");
    expect(tooltips.pron).toBe("translated:entry.abbreviation.pron");
    expect(tooltips.sta).toBe("translated:entry.abbreviation.sta");
  });

  it("exports regex fragments used by dictionary meaning highlighting", () => {
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("PC");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("STA");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("GK");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("IMPERS\\s+V");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("IMPERS\\.V");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("ethic\\s+DAT");
    expect(LEADING_GRAMMAR_LABEL_PATTERNS).toContain("ETHIC\\.DAT");
    expect(INLINE_GRAMMAR_ABBREVIATION_PATTERNS).toContain("\\bINTR\\b");
    expect(INLINE_GRAMMAR_ABBREVIATION_PATTERNS).toContain("\\bSTA\\b");
  });

  it("exports current summary lead-ins", () => {
    expect(DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS).toContain("sta");
    expect(DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS).toContain("gk");
    expect(DICTIONARY_GRAMMAR_SUMMARY_LEAD_INS).toContain("ethic dat");
  });
});
