import {
  PARTS_OF_SPEECH,
  type DictionaryPartOfSpeechFilter,
  type PartOfSpeech,
} from "@/features/dictionary/config";
import type {
  DictionarySenseGrammarPartOfSpeech,
  DictionarySenseGrammarValency,
  DictionarySenses,
  LexicalGender,
} from "@/features/dictionary/types";

type EntryGrammarSource = {
  senses?: DictionarySenses;
};

type EntryGrammarPartOfSpeech = DictionarySenseGrammarPartOfSpeech;

const PART_OF_SPEECH_SET = new Set<string>(PARTS_OF_SPEECH);

function isPartOfSpeech(value: string): value is PartOfSpeech {
  return PART_OF_SPEECH_SET.has(value);
}

function addUnique<T>(values: T[], value: T) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

export function getEntryGrammarPartOfSpeechValues(
  entry: EntryGrammarSource,
): EntryGrammarPartOfSpeech[] {
  const values: EntryGrammarPartOfSpeech[] = [];

  for (const group of entry.senses ?? []) {
    const pos = group.grammar.pos;

    if (pos) {
      addUnique(values, pos);
    }
  }

  return values;
}

export function getPrimaryEntryPartOfSpeech(
  entry: EntryGrammarSource,
): PartOfSpeech {
  const values = getEntryGrammarPartOfSpeechValues(entry);
  const primaryKnownPartOfSpeech = values.find((pos): pos is PartOfSpeech =>
    isPartOfSpeech(pos),
  );

  return (
    primaryKnownPartOfSpeech ?? (values.includes("PRON") ? "OTHER" : "UNKNOWN")
  );
}

export function entryHasPartOfSpeech(
  entry: EntryGrammarSource,
  partOfSpeech: EntryGrammarPartOfSpeech,
) {
  const values = getEntryGrammarPartOfSpeechValues(entry);

  return (
    values.includes(partOfSpeech) ||
    (partOfSpeech === "OTHER" && values.includes("PRON"))
  );
}

export function entryMatchesPartOfSpeechFilter(
  entry: EntryGrammarSource,
  filter: DictionaryPartOfSpeechFilter,
) {
  return filter === "ALL" || entryHasPartOfSpeech(entry, filter);
}

export function entryHasNounGrammar(entry: EntryGrammarSource) {
  return entryHasPartOfSpeech(entry, "N");
}

export function entryHasVerbGrammar(entry: EntryGrammarSource) {
  return entryHasPartOfSpeech(entry, "V");
}

export function getEntryNounGender(
  entry: EntryGrammarSource,
): LexicalGender | undefined {
  const nounGroup = entry.senses?.find((group) => group.grammar.pos === "N");

  if (!nounGroup && !entryHasNounGrammar(entry)) {
    return undefined;
  }

  return nounGroup?.grammar.gender ?? "";
}

export function getEntryVerbValencies(
  entry: EntryGrammarSource,
): DictionarySenseGrammarValency[] {
  const values: DictionarySenseGrammarValency[] = [];

  for (const group of entry.senses ?? []) {
    if (group.grammar.pos === "V" && group.grammar.valency) {
      addUnique(values, group.grammar.valency);
    }
  }

  return values;
}
