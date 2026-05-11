"use client";

import Link from "next/link";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getPreferredEntryPrincipalSpelling } from "@/features/dictionary/lib/entryDisplay";
import { getEntrySummary } from "@/features/dictionary/lib/entryText";
import type {
  LexicalEntry,
  LexicalGender,
  LexicalRelationType,
} from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import { antinoou } from "@/lib/fonts";
import { getEntryPath } from "@/lib/locale";

import HighlightText from "./HighlightText";
import { LinguisticGlossGroup } from "./LinguisticGloss";

type EntryRelationsPanelProps = {
  entry: LexicalEntry;
  parentEntry: LexicalEntry | null;
  relatedEntries: readonly LexicalEntry[];
};

function getRelationLabel(
  relationType: LexicalRelationType | undefined,
  t: ReturnType<typeof useLanguage>["t"],
) {
  switch (relationType) {
    case "feminine-counterpart":
      return t("entry.relation.feminineCounterpart");
    case "derived-subentry":
      return t("entry.relation.derivedSubentry");
    case "paradigm-member":
      return t("entry.relation.paradigmMember");
    default:
      return null;
  }
}

function getGenderMarkers(
  gender: LexicalGender,
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (!gender) {
    return [];
  }

  if (gender === "BOTH") {
    return [
      { code: "m", label: t("entry.gender.masculine") },
      { code: "f", label: t("entry.gender.feminine") },
    ];
  }

  return [
    gender === "M"
      ? { code: "m", label: t("entry.gender.masculine") }
      : { code: "f", label: t("entry.gender.feminine") },
  ];
}

function RelationEntryLink({
  entry,
  relationType,
}: {
  entry: LexicalEntry;
  relationType?: LexicalRelationType;
}) {
  const { language, t } = useLanguage();
  const relationLabel = getRelationLabel(relationType, t);
  const firstMeaning = getEntrySummary(entry, language);
  const genderMarkers = getGenderMarkers(entry.gender, t);

  return (
    <Link
      href={getEntryPath(entry.id, language)}
      className="group block rounded-2xl border border-stone-200 bg-white/75 p-4 transition-colors hover:border-stone-300 hover:bg-white dark:border-stone-800 dark:bg-stone-950/45 dark:hover:border-stone-700 dark:hover:bg-stone-950/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`${antinoou.className} text-2xl tracking-wide text-sky-700 transition-colors group-hover:text-sky-600 dark:text-sky-300 dark:group-hover:text-sky-200`}
          >
            <HighlightText
              text={getPreferredEntryPrincipalSpelling(entry)}
              query=""
            />
          </p>
          {firstMeaning ? (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {firstMeaning}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {relationLabel ? (
            <Badge tone="surface" size="xs">
              {relationLabel}
            </Badge>
          ) : null}
          <LinguisticGlossGroup
            markers={genderMarkers}
            size="compact"
            focusable={false}
          />
        </div>
      </div>
    </Link>
  );
}

export default function EntryRelationsPanel({
  entry,
  parentEntry,
  relatedEntries,
}: EntryRelationsPanelProps) {
  const { t } = useLanguage();

  if (!parentEntry && relatedEntries.length === 0) {
    return null;
  }

  return (
    <SurfacePanel className="p-6 md:p-7">
      <div className="space-y-6">
        {parentEntry ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("entry.baseEntry")}
            </h2>
            <RelationEntryLink
              entry={parentEntry}
              relationType={entry.relationType}
            />
          </section>
        ) : null}

        {relatedEntries.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {t("entry.relatedEntries")}
            </h2>
            <div
              className={cx(
                "grid gap-3",
                relatedEntries.length > 1 && "md:grid-cols-2",
              )}
            >
              {relatedEntries.map((relatedEntry) => (
                <RelationEntryLink
                  key={relatedEntry.id}
                  entry={relatedEntry}
                  relationType={relatedEntry.relationType}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SurfacePanel>
  );
}
