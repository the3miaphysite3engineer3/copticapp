import { grammarLesson01CoreConcepts } from "./v1/concepts/lesson-01-core.ts";
import { grammarLesson01NominalSentenceExamples } from "./v1/examples/lesson-01-nominal-sentences.ts";
import { grammarLesson01ZeroDeterminationExamples } from "./v1/examples/lesson-01-zero-determination.ts";
import { grammarLesson01Exercise01 } from "./v1/exercises/lesson-01-exercise-01.ts";
import { grammarLesson01FlashcardSeeds } from "./v1/flashcards/lesson-01.ts";
import { grammarLesson01CoreFootnotes } from "./v1/footnotes/lesson-01-core.ts";
import { grammarLesson01Document } from "./v1/lessons/lesson-01.ts";
import { grammarLesson02Document } from "./v1/lessons/lesson-02.ts";
import { grammarManifestV1 } from "./v1/manifest.ts";
import { grammarLesson01CoreSources } from "./v1/sources/lesson-01-core.ts";

import type {
  GrammarConceptDocument,
  GrammarDatasetSnapshot,
  GrammarExerciseDocument,
  GrammarFlashcardSeedDocument,
  GrammarLessonId,
  GrammarLessonIndexItem,
  GrammarSourceDocument,
} from "./schema.ts";

const lessonDocuments = [
  grammarLesson01Document,
  grammarLesson02Document,
] as const;
const conceptDocuments = [...grammarLesson01CoreConcepts] as const;
const exerciseDocuments = [grammarLesson01Exercise01] as const;
const exampleDocuments = [
  ...grammarLesson01ZeroDeterminationExamples,
  ...grammarLesson01NominalSentenceExamples,
] as const;
const footnoteDocuments = [...grammarLesson01CoreFootnotes] as const;
const flashcardSeedDocuments = [...grammarLesson01FlashcardSeeds] as const;
const sourceDocuments = [...grammarLesson01CoreSources] as const;

const lessonById = new Map(
  lessonDocuments.map((lesson) => [lesson.id, lesson]),
);
const lessonBySlug = new Map(
  lessonDocuments.map((lesson) => [lesson.slug, lesson]),
);
const conceptById = new Map(
  conceptDocuments.map((concept) => [concept.id, concept]),
);
const exerciseById = new Map(
  exerciseDocuments.map((exercise) => [exercise.id, exercise]),
);
const sourceById = new Map(
  sourceDocuments.map((source) => [source.id, source]),
);

export function getGrammarManifest() {
  return grammarManifestV1;
}

function listGrammarLessonDocuments() {
  return [...lessonDocuments];
}

export function listGrammarLessonIndexItems(): GrammarLessonIndexItem[] {
  return [...grammarManifestV1.lessons];
}

function listGrammarConceptDocuments(): GrammarConceptDocument[] {
  return [...conceptDocuments];
}

function _getGrammarConceptDocumentById(id: string) {
  return conceptById.get(id) ?? null;
}

function _getGrammarLessonDocumentById(id: GrammarLessonId) {
  return lessonById.get(id) ?? null;
}

export function getGrammarLessonDocumentBySlug(slug: string) {
  return lessonBySlug.get(slug) ?? null;
}

function listGrammarExerciseDocuments() {
  return [...exerciseDocuments];
}

function listGrammarSourceDocuments(): GrammarSourceDocument[] {
  return [...sourceDocuments];
}

function listGrammarFlashcardSeedDocuments(): GrammarFlashcardSeedDocument[] {
  return [...flashcardSeedDocuments];
}

function _getGrammarSourceDocumentById(id: string) {
  return sourceById.get(id) ?? null;
}

export function getGrammarExerciseDocumentById(id: string) {
  return exerciseById.get(id) ?? null;
}

function _getGrammarExercisesForLesson(
  lessonId: GrammarLessonId,
): GrammarExerciseDocument[] {
  return exerciseDocuments.filter((exercise) => exercise.lessonId === lessonId);
}

export function getGrammarDatasetSnapshot(): GrammarDatasetSnapshot {
  return {
    manifest: grammarManifestV1,
    lessons: listGrammarLessonDocuments(),
    concepts: listGrammarConceptDocuments(),
    examples: [...exampleDocuments],
    exercises: listGrammarExerciseDocuments(),
    flashcardSeeds: listGrammarFlashcardSeedDocuments(),
    footnotes: [...footnoteDocuments],
    sources: listGrammarSourceDocuments(),
  };
}
