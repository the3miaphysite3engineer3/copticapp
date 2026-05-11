"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { LexicalEntry } from "@/features/dictionary/types";
import { RelatedGrammarLessonsPanel } from "@/features/grammar/components/RelatedGrammarLessonsPanel";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";

import DictionaryEntryCard from "./DictionaryEntry";
import { EntryActionBar } from "./EntryActionBar";
import EntryRelationsPanel from "./EntryRelationsPanel";

type EntryPageClientProps = {
  initialEntry: LexicalEntry;
  initialParentEntry: LexicalEntry | null;
  initialRelatedEntries: readonly LexicalEntry[];
  relatedGrammarLessons: readonly GrammarLessonReference[];
};

export default function EntryPageClient({
  initialEntry,
  initialParentEntry,
  initialRelatedEntries,
  relatedGrammarLessons,
}: EntryPageClientProps) {
  const { language } = useLanguage();
  const hasSupportingContent =
    Boolean(initialParentEntry) ||
    initialRelatedEntries.length > 0 ||
    relatedGrammarLessons.length > 0;
  const genderedCounterparts = initialRelatedEntries.filter(
    (entry) => entry.relationType === "feminine-counterpart",
  );

  return (
    <>
      <DictionaryEntryCard
        actions={
          <EntryActionBar
            compact
            entry={initialEntry}
            parentEntry={initialParentEntry}
            relatedEntries={initialRelatedEntries}
          />
        }
        entry={initialEntry}
        genderedCounterparts={genderedCounterparts}
        headingLevel="h1"
        linkHeadword={false}
      />
      {hasSupportingContent ? (
        <div className="mt-10 space-y-8 md:space-y-10">
          <EntryRelationsPanel
            entry={initialEntry}
            parentEntry={initialParentEntry}
            relatedEntries={initialRelatedEntries}
          />
          <RelatedGrammarLessonsPanel
            contained
            description={
              language === "nl"
                ? "Bekijk de grammaticahandleidingen waarin dit lemma expliciet voorkomt of verder wordt uitgelegd."
                : "Explore the grammar lessons where this entry appears explicitly or is discussed in more detail."
            }
            language={language}
            lessons={relatedGrammarLessons}
            title={
              language === "nl"
                ? "Komt voor in grammaticalessen"
                : "Appears in grammar lessons"
            }
          />
        </div>
      ) : null}
    </>
  );
}
