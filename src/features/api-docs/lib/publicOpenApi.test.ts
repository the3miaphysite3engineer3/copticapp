import { describe, expect, it } from "vitest";

import { getPublicOpenApiDocument } from "./publicOpenApi";

describe("public OpenAPI document", () => {
  it("describes the public API routes and docs metadata", () => {
    const document = getPublicOpenApiDocument() as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
      tags: Array<{ name: string }>;
      components: {
        parameters: Record<string, unknown>;
        schemas: Record<string, unknown>;
      };
    };

    expect(document.openapi).toBe("3.0.3");
    expect(document.info.title).toBe("Coptic Compass Public API");
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        "/api/v1/grammar",
        "/api/v1/grammar/manifest",
        "/api/v1/grammar/lessons",
        "/api/v1/grammar/lessons/{slug}",
        "/api/v1/grammar/examples",
        "/api/v1/grammar/exercises",
        "/api/v1/grammar/concepts",
        "/api/v1/grammar/concepts/{id}",
        "/api/v1/grammar/footnotes",
        "/api/v1/grammar/sources",
        "/api/v1/grammar/sources/{id}",
        "/api/v1/dictionary/search",
        "/api/v1/dictionary/search-index",
        "/api/shenute",
        "/api/ocr",
      ]),
    );
    expect(document.tags.map((tag) => tag.name)).toEqual(
      expect.arrayContaining([
        "Index",
        "Lessons",
        "Examples",
        "Exercises",
        "Concepts",
        "Footnotes",
        "Sources",
        "Dictionary",
        "Shenute AI",
        "OCR",
      ]),
    );
    expect(document.components.parameters).toHaveProperty("LessonFilter");
    expect(document.components.parameters).toHaveProperty("DictionaryQuery");
    expect(document.components.schemas).toHaveProperty("GrammarApiIndex");
    expect(document.components.schemas).toHaveProperty(
      "GrammarLessonBundleEnvelope",
    );
    expect(document.components.schemas).toHaveProperty("DictionarySearchPage");
    expect(document.components.schemas).toHaveProperty("ShenuteRequest");
    expect(document.components.schemas).toHaveProperty("OcrUploadRequest");
  });
});
