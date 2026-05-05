"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { useLanguage } from "@/components/LanguageProvider";
import { MicroTooltip } from "@/components/MicroTooltip";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  getPartOfSpeechCode,
  getPartOfSpeechLabel,
} from "@/features/dictionary/config";
import type {
  DialectFilter,
  DictionaryDialectCode,
} from "@/features/dictionary/config";
import {
  formatDialectForms,
  getDialectVariantRows,
  getPreferredEntryDialectKey,
} from "@/features/dictionary/lib/entryDisplay";
import type {
  ConstructParticipleCompound,
  DictionaryClientEntry,
} from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import { antinoou } from "@/lib/fonts";
import { getEntryPath } from "@/lib/locale";

import DialectSiglum from "./DialectSiglum";
import HighlightText from "./HighlightText";
import { SpeakButton } from "./SpeakButton";

import type {
  FormSymbolTooltips,
  GrammarAbbreviationTooltips,
} from "./HighlightText";

type DictionaryEntryCardProps = {
  entry: DictionaryClientEntry;
  query?: string;
  selectedDialect?: DialectFilter;
  headingLevel?: "h1" | "h2";
  linkHeadword?: boolean;
  actions?: ReactNode;
};

type DialectEntryTuple = [
  DictionaryDialectCode,
  NonNullable<DictionaryClientEntry["dialects"][DictionaryDialectCode]>,
];
type EntryDialectSelection = "ALL" | DictionaryDialectCode;

function getFormSymbolTooltips(
  t: ReturnType<typeof useLanguage>["t"],
): FormSymbolTooltips {
  return {
    "-": t("entry.symbol.nominal"),
    "=": t("entry.symbol.pronominal"),
    "†": t("entry.symbol.stative"),
    "~": t("entry.symbol.constructParticiple"),
  };
}

function getGrammarAbbreviationTooltips(
  t: ReturnType<typeof useLanguage>["t"],
): GrammarAbbreviationTooltips {
  return {
    acc: t("entry.abbreviation.acc"),
    adj: t("entry.abbreviation.adj"),
    adv: t("entry.abbreviation.adv"),
    advb: t("entry.abbreviation.advb"),
    art: t("entry.abbreviation.art"),
    auxil: t("entry.abbreviation.auxil"),
    c: t("entry.abbreviation.c"),
    caus: t("entry.abbreviation.caus"),
    conj: t("entry.abbreviation.conj"),
    constr: t("entry.abbreviation.constr"),
    dat: t("entry.abbreviation.dat"),
    def: t("entry.abbreviation.def"),
    esp: t("entry.abbreviation.esp"),
    ethical: t("entry.abbreviation.ethical"),
    ethic: t("entry.abbreviation.ethical"),
    gen: t("entry.abbreviation.gen"),
    gk: t("entry.abbreviation.gk"),
    impers: t("entry.abbreviation.impers"),
    "impers vb": t("entry.abbreviation.impersVerb"),
    indef: t("entry.abbreviation.indef"),
    int: t("entry.abbreviation.int"),
    interrog: t("entry.abbreviation.interrog"),
    intr: t("entry.abbreviation.intr"),
    kwal: t("entry.abbreviation.qual"),
    lit: t("entry.abbreviation.lit"),
    neg: t("entry.abbreviation.neg"),
    nn: t("entry.abbreviation.nn"),
    nom: t("entry.abbreviation.nom"),
    obj: t("entry.abbreviation.obj"),
    pc: t("entry.abbreviation.pc"),
    pl: t("entry.abbreviation.pl"),
    poss: t("entry.abbreviation.poss"),
    pref: t("entry.abbreviation.pref"),
    prep: t("entry.abbreviation.prep"),
    prob: t("entry.abbreviation.prob"),
    pron: t("entry.abbreviation.pron"),
    pronom: t("entry.abbreviation.pronom"),
    qual: t("entry.abbreviation.qual"),
    rare: t("entry.abbreviation.rare"),
    refl: t("entry.abbreviation.refl"),
    rel: t("entry.abbreviation.rel"),
    sg: t("entry.abbreviation.sg"),
    sim: t("entry.abbreviation.sim"),
    subj: t("entry.abbreviation.subj"),
    suff: t("entry.abbreviation.suff"),
    tr: t("entry.abbreviation.tr"),
    vbal: t("entry.abbreviation.vbal"),
    vb: t("entry.abbreviation.vb"),
  };
}

function MetadataTooltip({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <MicroTooltip
      alignItems="center"
      className="leading-none whitespace-nowrap"
      label={label}
    >
      {children}
    </MicroTooltip>
  );
}

function getCompoundMeanings(
  compound: ConstructParticipleCompound,
  language: ReturnType<typeof useLanguage>["language"],
) {
  return language === "nl" && compound.dutch_meanings
    ? compound.dutch_meanings
    : compound.english_meanings;
}

function getCompoundGenderMarkers(
  gender: ConstructParticipleCompound["gender"],
  language: ReturnType<typeof useLanguage>["language"],
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (!gender) {
    return [];
  }

  const feminineCode = language === "nl" ? "V" : "F";
  const markers =
    gender === "BOTH"
      ? [
          { code: "M", label: t("entry.gender.masculine") },
          { code: feminineCode, label: t("entry.gender.feminine") },
        ]
      : [
          gender === "M"
            ? { code: "M", label: t("entry.gender.masculine") }
            : { code: feminineCode, label: t("entry.gender.feminine") },
        ];

  return markers;
}

export default function DictionaryEntryCard({
  actions,
  entry,
  query = "",
  selectedDialect = DEFAULT_DICTIONARY_DIALECT_FILTER,
  headingLevel = "h2",
  linkHeadword = true,
}: DictionaryEntryCardProps) {
  const { language, t } = useLanguage();
  const articleRef = useRef<HTMLElement>(null);
  const [viewDialect, setViewDialect] =
    useState<EntryDialectSelection>(selectedDialect);
  const [prevSelectedDialect, setPrevSelectedDialect] =
    useState<DialectFilter>(selectedDialect);

  if (selectedDialect !== prevSelectedDialect) {
    setPrevSelectedDialect(selectedDialect);
    setViewDialect(selectedDialect);
  }

  const isDetailView = headingLevel === "h1";
  const primaryDialectKey = getPreferredEntryDialectKey(entry, viewDialect);

  let headerSpelling = entry.headword;
  const primaryForms = primaryDialectKey
    ? entry.dialects[primaryDialectKey]
    : undefined;

  if (primaryForms) {
    /**
     * Collapse the selected dialect's forms into the compact heading notation
     * used throughout the dictionary UI.
     */
    headerSpelling = formatDialectForms(primaryForms, entry.headword);
  }

  const canSpeakPrimarySpelling = primaryDialectKey === "B";
  const remainingDialects = Object.entries(entry.dialects).filter(
    (dialectEntry): dialectEntry is DialectEntryTuple =>
      dialectEntry[0] !== primaryDialectKey && Boolean(dialectEntry[1]),
  );
  const HeadingTag = headingLevel;
  const headingClassName = `${antinoou.className} ${
    isDetailView ? "text-5xl md:text-6xl" : "text-4xl"
  } text-sky-600 dark:text-sky-400 tracking-wider drop-shadow-sm transition-colors ${
    linkHeadword
      ? "hover:text-sky-500 dark:hover:text-sky-300 cursor-pointer"
      : ""
  }`;
  const formSymbolTooltips = getFormSymbolTooltips(t);
  const grammarAbbreviationTooltips = getGrammarAbbreviationTooltips(t);
  const headingContent = (
    <HeadingTag className={headingClassName}>
      <HighlightText
        text={headerSpelling}
        query={query}
        symbolTooltips={formSymbolTooltips}
      />
    </HeadingTag>
  );
  const partOfSpeechLabel = getPartOfSpeechLabel(entry.pos, t);
  const partOfSpeechCode = getPartOfSpeechCode(entry.pos);
  const meanings =
    language === "nl" && entry.dutch_meanings
      ? entry.dutch_meanings
      : entry.english_meanings;
  const variantRows =
    primaryDialectKey && primaryForms
      ? getDialectVariantRows(primaryForms).map((row) => ({
          dialect: primaryDialectKey,
          ...row,
        }))
      : [];
  const constructParticipleCompounds =
    primaryForms?.constructParticipleCompounds ?? [];
  const compactBadgeClassName = "h-8 min-h-8 min-w-8 justify-center px-3";
  const handleDialectViewChange = (dialect: DictionaryDialectCode) => {
    setViewDialect(dialect);

    if (isDetailView) {
      articleRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const metadataBadges = (
    <>
      <Badge tone="neutral" size="sm" className={compactBadgeClassName}>
        <MetadataTooltip label={partOfSpeechLabel}>
          {partOfSpeechCode}
        </MetadataTooltip>
      </Badge>
      {entry.gender && (
        <span
          className={`inline-flex h-8 items-center rounded-full border px-3 ${
            entry.gender === "F"
              ? "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-900/50 dark:bg-pink-950/40 dark:text-pink-300"
              : "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
          }`}
        >
          {t("entry.gender")}: {entry.gender}
        </span>
      )}
      {primaryDialectKey && (
        <Badge tone="neutral" size="sm" className={compactBadgeClassName}>
          <DialectSiglum siglum={primaryDialectKey} />
        </Badge>
      )}
    </>
  );

  return (
    <article
      ref={articleRef}
      className={surfacePanelClassName({
        rounded: "3xl",
        interactive: linkHeadword,
        className: cx(
          "group relative overflow-hidden",
          linkHeadword &&
            "hover:border-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-800/50",
          isDetailView ? "p-8 md:p-10" : "p-6 md:p-7",
        ),
      })}
    >
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl opacity-70" />

      {isDetailView ? (
        <div className="relative mb-5 flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            {linkHeadword ? (
              <Link
                href={getEntryPath(entry.id, language)}
                prefetch={false}
                className="inline-block max-w-full break-words [overflow-wrap:anywhere]"
              >
                {headingContent}
              </Link>
            ) : (
              headingContent
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {canSpeakPrimarySpelling && (
              <SpeakButton
                copticText={headerSpelling}
                className="h-8 w-8 rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
              />
            )}
            {metadataBadges}
          </div>
        </div>
      ) : (
        <div className="relative mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-start gap-3">
            <div className="min-w-0">
              {linkHeadword ? (
                <Link
                  href={getEntryPath(entry.id, language)}
                  prefetch={false}
                  className="inline-block max-w-full break-words [overflow-wrap:anywhere]"
                >
                  {headingContent}
                </Link>
              ) : (
                headingContent
              )}
            </div>
            {canSpeakPrimarySpelling && (
              <SpeakButton
                copticText={headerSpelling}
                className="mt-1 shrink-0 sm:mt-1.5"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {metadataBadges}
          </div>
        </div>
      )}

      <div className="h-px w-full bg-gradient-to-r from-stone-200 dark:from-stone-800 via-stone-300 dark:via-stone-700 to-stone-200 dark:to-stone-800 mb-6" />

      <div className="mb-6 space-y-3">
        <h3 className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest font-semibold">
          {t("entry.translation")}
        </h3>
        <ul
          className={`space-y-2 text-stone-800 dark:text-stone-200 list-disc ml-5 marker:text-sky-500 ${
            isDetailView ? "text-lg md:text-xl" : "text-lg"
          }`}
        >
          {meanings.map((meaning, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              <HighlightText
                text={meaning}
                query={query}
                emphasizeLeadingLabel
                grammarAbbreviationTooltips={grammarAbbreviationTooltips}
              />
            </li>
          ))}
        </ul>
        {variantRows.length > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
              {t("entry.variants")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {variantRows.map(({ dialect, forms, state }, index) => (
                <span
                  key={`${dialect}-${state}-${index}`}
                  className="inline-flex max-w-full items-start gap-2 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 text-sm text-stone-700 dark:border-stone-800/60 dark:bg-stone-950/50 dark:text-stone-300"
                >
                  <span className="inline-flex min-h-6 shrink-0 items-center rounded-md bg-stone-200 px-2 text-[10px] font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                    <DialectSiglum siglum={dialect} />
                  </span>
                  <span
                    className={`${antinoou.className} min-w-0 break-words text-base leading-snug [overflow-wrap:anywhere]`}
                  >
                    <HighlightText
                      text={forms.join(", ")}
                      query={query}
                      symbolTooltips={formSymbolTooltips}
                    />
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
        {constructParticipleCompounds.length > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
              {t("entry.constructParticipleCompounds")}
            </span>
            <div className="grid gap-2.5">
              {constructParticipleCompounds.map((compound, index) => {
                const compoundMeanings = getCompoundMeanings(
                  compound,
                  language,
                );
                const genderMarkers = getCompoundGenderMarkers(
                  compound.gender,
                  language,
                  t,
                );

                return (
                  <div
                    key={`${compound.form}-${index}`}
                    className="grid gap-1.5 border-l-2 border-sky-200 pl-3 dark:border-sky-900/70"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span
                        className={`${antinoou.className} min-w-0 break-words text-lg leading-snug text-stone-800 [overflow-wrap:anywhere] dark:text-stone-200`}
                      >
                        <HighlightText
                          text={compound.form}
                          query={query}
                          symbolTooltips={formSymbolTooltips}
                        />
                      </span>
                      {genderMarkers.length > 0 && (
                        <span className="inline-flex items-baseline gap-1 text-sm leading-none text-stone-500 dark:text-stone-400">
                          {genderMarkers.map((marker) => (
                            <MicroTooltip
                              key={marker.code}
                              label={marker.label}
                              className="small-caps whitespace-nowrap"
                            >
                              {marker.code}
                            </MicroTooltip>
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                      <HighlightText
                        text={compoundMeanings.join("; ")}
                        query={query}
                        grammarAbbreviationTooltips={
                          grammarAbbreviationTooltips
                        }
                      />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {entry.greek_equivalents.length > 0 && (
          <div className="mt-5 flex flex-col gap-3">
            <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
              {t("entry.greekEquivalents")}
            </span>
            <div className="flex flex-wrap gap-2">
              {entry.greek_equivalents.map((gr, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium"
                >
                  <HighlightText text={gr} query={query} />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {actions ? (
        <div className="mt-7 border-t border-stone-200 pt-5 dark:border-stone-800/50">
          {actions}
        </div>
      ) : null}

      {remainingDialects.length > 0 && (
        <div className="mt-7 pt-5 border-t border-stone-200 dark:border-stone-800/50">
          <h4 className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest font-semibold mb-3">
            {t("entry.dialectForms")}
          </h4>
          <div className="flex flex-wrap gap-3">
            {remainingDialects.map(([dialect, forms]) => {
              const spelling = formatDialectForms(forms, entry.headword);

              return (
                <button
                  key={dialect}
                  type="button"
                  onClick={() => handleDialectViewChange(dialect)}
                  aria-label={`${t("entry.dialectForms")}: ${dialect} ${spelling}`}
                  className="flex min-w-0 max-w-full basis-full items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2.5 text-left transition hover:border-sky-300 hover:bg-sky-50/80 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none dark:border-stone-800/60 dark:bg-stone-950/50 dark:hover:border-sky-700 dark:hover:bg-sky-950/30 dark:focus-visible:ring-offset-stone-950 sm:basis-auto"
                >
                  <span className="inline-flex min-h-7 shrink-0 items-center rounded-md bg-stone-200 px-2.5 py-2 text-[10px] font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                    <DialectSiglum focusableTooltip={false} siglum={dialect} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`${antinoou.className} block break-words text-lg leading-snug text-stone-800 [overflow-wrap:anywhere] dark:text-stone-300`}
                    >
                      <HighlightText
                        text={spelling}
                        query={query}
                        symbolTooltips={formSymbolTooltips}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
