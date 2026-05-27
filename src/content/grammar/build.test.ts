import { describe, expect, it } from "vitest";

import { createGrammarStaticExportFiles } from "./build";

describe("grammar static export files", () => {
  it("creates manifest, collection, and lesson export payloads", () => {
    const files = createGrammarStaticExportFiles();
    const outputPaths = files.map((file) => file.outputPath);

    expect(outputPaths).toEqual([
      "grammar/v1/manifest.json",
      "grammar/v1/concepts.json",
      "grammar/v1/examples.json",
      "grammar/v1/exercises.json",
      "grammar/v1/flashcards.json",
      "grammar/v1/footnotes.json",
      "grammar/v1/sources.json",
      "grammar/v1/lessons/lesson-1.json",
    ]);
  });

  it("wraps non-manifest exports with version metadata", () => {
    const files = createGrammarStaticExportFiles();
    const lessonExport = files.find(
      (file) => file.outputPath === "grammar/v1/lessons/lesson-1.json",
    );

    expect(lessonExport?.payload).toMatchObject({
      schemaVersion: "1.0.0",
      datasetVersion: "2026-03-22",
      generatedAt: "2026-03-22T00:00:00.000Z",
      data: {
        lesson: {
          id: "grammar.lesson.01",
          slug: "lesson-1",
        },
      },
    });
  });

  it("exports populated concept and source collections", () => {
    const files = createGrammarStaticExportFiles();
    const conceptsExport = files.find(
      (file) => file.outputPath === "grammar/v1/concepts.json",
    );
    const sourcesExport = files.find(
      (file) => file.outputPath === "grammar/v1/sources.json",
    );

    const conceptsData =
      conceptsExport?.payload &&
      typeof conceptsExport.payload === "object" &&
      "data" in conceptsExport.payload
        ? conceptsExport.payload.data
        : undefined;
    const sourcesData =
      sourcesExport?.payload &&
      typeof sourcesExport.payload === "object" &&
      "data" in sourcesExport.payload
        ? sourcesExport.payload.data
        : undefined;

    expect(conceptsData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "grammar.concept.bare-noun",
        }),
        expect.objectContaining({
          id: "grammar.concept.nomina-sacra",
        }),
      ]),
    );
    expect(sourcesData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "grammar.source.basisgrammatica-bohairisch-koptisch",
          title: "Inleiding tot het Bohairisch Koptisch: Basisgrammatica",
        }),
      ]),
    );
  });

  it("omits draft lessons from the public static export", () => {
    const files = createGrammarStaticExportFiles();
    const manifest = files.find(
      (file) => file.outputPath === "grammar/v1/manifest.json",
    );

    expect(outputPathsContain(files, "grammar/v1/lessons/lesson-2.json")).toBe(
      false,
    );
    expect(manifest?.payload).toMatchObject({
      lessons: [
        {
          slug: "lesson-1",
          status: "published",
        },
      ],
    });
  });
});

function outputPathsContain(
  files: ReturnType<typeof createGrammarStaticExportFiles>,
  outputPath: string,
) {
  return files.some((file) => file.outputPath === outputPath);
}
