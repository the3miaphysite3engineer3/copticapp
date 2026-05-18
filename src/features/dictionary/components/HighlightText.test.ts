import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import HighlightText from "./HighlightText";

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "font-coptic",
    variable: "--font-coptic",
  }),
}));

vi.mock("next/font/google", () => ({
  Manrope: () => ({
    className: "font-sans",
    variable: "--font-ui",
  }),
}));

describe("HighlightText", () => {
  it("renders Coptic form symbols with the Coptic font", () => {
    const markup = renderToStaticMarkup(
      React.createElement(HighlightText, {
        text: "ϭⲓ-/ϭⲓⲧ= ϭⲏⲟⲩ† ϭⲁⲓ~",
        query: "",
        symbolTooltips: {
          "-": "Nominal state",
          "=": "Pronominal state",
          "†": "Stative form",
          "~": "Construct participle",
        },
      }),
    );

    expect(markup).toContain('<span class="font-coptic">-</span>');
    expect(markup).toContain('<span class="font-coptic">=</span>');
    expect(markup).toContain(
      '<sup class="align-super text-[0.65em] leading-none text-current font-coptic">†</sup>',
    );
    expect(markup).toContain(">~<");
    expect(markup).not.toContain('<span class="font-coptic">~</span>');
  });

  it("renders dictionary grammar abbreviations in lesson abbreviation style", () => {
    const markup = renderToStaticMarkup(
      React.createElement(HighlightText, {
        text: "pc, ABFLOS, carrier with sta: state",
        query: "",
        emphasizeLeadingLabel: true,
        grammarAbbreviationTooltips: {
          pc: "Construct participle",
          sta: "Stative",
        },
      }),
    );

    expect(markup).toContain(
      '<span aria-label="Construct participle" class="group/micro-tooltip',
    );
    expect(markup).toContain(
      '<span aria-label="Stative" class="group/micro-tooltip',
    );
    expect(markup).toContain(">pc<");
    expect(markup).toContain(">sta<");
    expect(markup).toContain("Construct participle");
    expect(markup).toContain("Stative");
    expect(markup).toContain("ABFLOS carrier");
    expect(markup).not.toContain("font-bold");
    expect(markup).not.toContain("sta:");
    expect(markup).not.toContain("ABFLOS,");
  });
});
