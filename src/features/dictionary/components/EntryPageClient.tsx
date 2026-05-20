"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { DictionaryClientEntry } from "@/features/dictionary/types";
import { RelatedGrammarLessonsPanel } from "@/features/grammar/components/RelatedGrammarLessonsPanel";
import type { GrammarLessonReference } from "@/features/grammar/lib/grammarContentGraph";

import DictionaryEntryCard from "./DictionaryEntry";
import { EntryActionBar } from "./EntryActionBar";

type EntryPageClientProps = {
  initialEntry: DictionaryClientEntry;
  relatedGrammarLessons: readonly GrammarLessonReference[];
};

export default function EntryPageClient({
  initialEntry,
  relatedGrammarLessons,
}: EntryPageClientProps) {
  const { language } = useLanguage();
  const hasSupportingContent = relatedGrammarLessons.length > 0;

  return (
    <>
      <DictionaryEntryCard
        actions={<EntryActionBar compact entry={initialEntry} />}
        entry={initialEntry}
        headingLevel="h1"
        linkHeadword={false}
      />
      {hasSupportingContent ? (
        <div className="mt-10 space-y-8 md:space-y-10">
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
