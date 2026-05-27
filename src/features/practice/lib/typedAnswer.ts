export type TypedFlashcardAnswerResult = "correct" | "empty" | "incorrect";

const COMBINING_MARKS_PATTERN =
  /[\u0300-\u036f\u0483-\u0489\u1dc0-\u1dff\u20d0-\u20ff\u2cef-\u2cf1\ufe20-\ufe2f]/g;
const IGNORED_SEPARATOR_PATTERN = /[\s.,;:!?'"`’‘“”·•·⸱()[\]{}<>/\\|_=+†~*-]+/g;

export function normalizeTypedFlashcardAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(COMBINING_MARKS_PATTERN, "")
    .replace(IGNORED_SEPARATOR_PATTERN, "");
}

export function compareTypedFlashcardAnswer({
  expected,
  input,
}: {
  expected: string;
  input: string;
}): TypedFlashcardAnswerResult {
  const normalizedInput = normalizeTypedFlashcardAnswer(input);

  if (!normalizedInput) {
    return "empty";
  }

  return normalizedInput === normalizeTypedFlashcardAnswer(expected)
    ? "correct"
    : "incorrect";
}
