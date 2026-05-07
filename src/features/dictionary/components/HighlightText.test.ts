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

describe("HighlightText", () => {
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
    expect(markup).toContain("small-caps whitespace-nowrap");
    expect(markup).toContain("Construct participle");
    expect(markup).toContain("Stative");
    expect(markup).toContain("ABFLOS carrier");
    expect(markup).not.toContain("font-bold");
    expect(markup).not.toContain("sta:");
    expect(markup).not.toContain("ABFLOS,");
  });
});
