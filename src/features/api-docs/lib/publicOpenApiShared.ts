import {
  getGrammarApiIndex,
  getGrammarApiManifest,
} from "@/features/grammar/lib/grammarApi";
import { siteConfig } from "@/lib/site";

export type OpenApiDocument = Record<string, unknown>;

export type PublicOpenApiContext = {
  apiIndex: ReturnType<typeof getGrammarApiIndex>;
  authorName: string;
  exampleConceptId: string;
  exampleLessonId: string;
  exampleLessonSlug: string;
  exampleSourceId: string;
  liveUrl: string;
  manifest: ReturnType<typeof getGrammarApiManifest>;
};

/**
 * Declares the tag groups exposed in the generated public OpenAPI document.
 */
export const PUBLIC_OPEN_API_TAGS = [
  {
    name: "Index",
    description: "Machine-readable discovery and manifest endpoints.",
  },
  {
    name: "Lessons",
    description: "Lesson index and full lesson bundles.",
  },
  {
    name: "Examples",
    description: "Sentence examples grouped by lesson.",
  },
  {
    name: "Exercises",
    description: "Exercise definitions for study or review workflows.",
  },
  {
    name: "Concepts",
    description: "Canonical grammar concepts and glossary-style records.",
  },
  {
    name: "Footnotes",
    description: "Footnotes attached to lessons.",
  },
  {
    name: "Sources",
    description: "Publication and source metadata referenced by lessons.",
  },
  {
    name: "Dictionary",
    description: "Paginated dictionary search and reduced dictionary index.",
  },
  {
    name: "Shenute AI",
    description:
      "Authenticated Shenute AI chat endpoint with provider routing.",
  },
  {
    name: "OCR",
    description:
      "Server-side OCR proxy for multipart image and document uploads.",
  },
] as const;

/**
 * Builds the shared schema fragment used for localized English/Dutch text
 * fields in the grammar API spec.
 */
export function createLocalizedStringSchema(description: string) {
  return {
    type: "object",
    description,
    required: ["en", "nl"],
    properties: {
      en: {
        type: "string",
      },
      nl: {
        type: "string",
      },
    },
    additionalProperties: false,
  };
}

/**
 * Wraps a schema reference in the versioned response envelope used by the
 * public grammar API exports.
 */
export function createVersionedEnvelopeSchema(
  dataSchemaRef: string,
  description: string,
) {
  return {
    type: "object",
    description,
    required: ["schemaVersion", "datasetVersion", "generatedAt", "data"],
    properties: {
      schemaVersion: {
        type: "string",
        example: "1.0.0",
      },
      datasetVersion: {
        type: "string",
        example: "2026-03-22",
      },
      generatedAt: {
        type: "string",
        format: "date-time",
        example: "2026-03-22T00:00:00.000Z",
      },
      data: {
        $ref: dataSchemaRef,
      },
    },
    additionalProperties: false,
  };
}

/**
 * Resolves the example values and site metadata used while generating the
 * public OpenAPI document.
 */
export function createPublicOpenApiContext(): PublicOpenApiContext {
  const apiIndex = getGrammarApiIndex();
  const manifest = getGrammarApiManifest();
  const publishedLesson = manifest.lessons.find(
    (lesson) => lesson.status === "published",
  );

  return {
    apiIndex,
    authorName: siteConfig.author.name,
    exampleConceptId: "grammar.concept.significant-letters",
    exampleLessonId: publishedLesson?.id ?? "grammar.lesson.01",
    exampleLessonSlug: publishedLesson?.slug ?? "lesson-1",
    exampleSourceId: "grammar.source.basisgrammatica-bohairisch-koptisch",
    liveUrl: siteConfig.liveUrl,
    manifest,
  };
}

/**
 * Builds the top-level OpenAPI info block for the public API surface.
 */
export function buildPublicOpenApiInfo(context: PublicOpenApiContext) {
  const { apiIndex, authorName, liveUrl, manifest } = context;

  return {
    title: "Coptic Compass Public API",
    version: manifest.datasetVersion,
    description: [
      "Public API surface for Coptic Compass.",
      "",
      "Includes the versioned read-only grammar dataset, dictionary search, Shenute AI, and OCR proxy endpoints.",
      "",
      `Grammar API: ${apiIndex.description}`,
      "",
      "These APIs are intended for web clients, flashcard tools, mobile apps, research scripts, and app integrations.",
      "Grammar responses are versioned with schema and dataset metadata.",
      "Grammar lesson content is all-rights-reserved; check the rights fields before reuse.",
      "Shenute AI requires an authenticated user session.",
      "OCR proxy behavior depends on the configured OCR_SERVICE_URL upstream.",
    ].join("\n"),
    contact: {
      name: authorName,
      url: liveUrl,
    },
    license: {
      name: "All rights reserved",
    },
  };
}
