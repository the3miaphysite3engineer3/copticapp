"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileClock,
  FileText,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppPageIntro } from "@/components/AppPageIntro";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/components/LanguageProvider";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel, surfacePanelClassName } from "@/components/SurfacePanel";
import {
  getPublicationFormatLabel,
  getPublicationPath,
  publications,
} from "@/features/publications/lib/publications";
import type {
  LanguageBadge,
  Publication,
  PublicationStatus,
} from "@/features/publications/lib/publications";
import { cx } from "@/lib/classes";
import { getLocalizedHomePath } from "@/lib/locale";

type PublicationLanguageFilter = "ALL" | LanguageBadge;
type PublicationStatusFilter = "ALL" | PublicationStatus;

const languageFilterOptions: PublicationLanguageFilter[] = [
  "ALL",
  "COP",
  "NL",
  "EN",
];
const statusFilterOptions: PublicationStatusFilter[] = [
  "ALL",
  "published",
  "forthcoming",
];

function getCountLabel(count: number, itemLabel: string, itemsLabel: string) {
  return `${count} ${count === 1 ? itemLabel : itemsLabel}`;
}

function CatalogStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <SurfacePanel
      rounded="lg"
      shadow="soft"
      variant="elevated"
      className="flex items-center gap-4 p-5 text-left"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-widest text-muted">
          {label}
        </span>
        <span className="mt-1 block text-lg font-semibold text-ink">
          {value}
        </span>
      </span>
    </SurfacePanel>
  );
}

function TileInner({
  pub,
  comingSoonLabel,
  externalAvailableLabel,
  formatLabel,
  priority = false,
  statusLabel,
  viewDetailsLabel,
}: {
  pub: Publication;
  comingSoonLabel: string;
  externalAvailableLabel: string;
  formatLabel: string;
  priority?: boolean;
  statusLabel: string;
  viewDetailsLabel: string;
}) {
  return (
    <>
      <div className="relative mb-5 aspect-[3/4.2] w-full overflow-hidden rounded-lg border border-line/80 bg-paper shadow-sm">
        {pub.image ? (
          <Image
            src={pub.image}
            alt={pub.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 268px, (min-width: 640px) calc((100vw - 6rem) / 2), calc(100vw - 3rem)"
            className="object-contain object-center p-2.5"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-elevated p-6">
            <div className="max-w-48 text-center">
              <Badge tone="surface" size="sm" caps>
                {comingSoonLabel}
              </Badge>
              <p className="mt-4 text-sm font-semibold leading-6 text-muted">
                {pub.title}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge
          tone={pub.status === "published" ? "accent" : "neutral"}
          size="xs"
        >
          {statusLabel}
        </Badge>
        <Badge tone={pub.lang === "COP" ? "coptic" : "surface"} size="xs">
          {pub.lang}
        </Badge>
        <Badge tone="surface" size="xs">
          {formatLabel}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-end">
        <h2 className="z-10 mb-1 line-clamp-3 text-lg font-bold leading-snug text-ink">
          {pub.title}
        </h2>
        {pub.subtitle && (
          <p className="z-10 mb-2 text-xs leading-snug text-muted">
            {pub.subtitle}
          </p>
        )}
        {pub.link && pub.status === "published" ? (
          <p className="z-10 mt-3 flex items-center text-sm font-medium text-muted">
            {externalAvailableLabel}
            <ArrowUpRight className="ml-1 h-4 w-4 translate-x-[-10px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </p>
        ) : null}
        <p className="z-10 mt-5 flex items-center text-sm font-semibold text-accent-strong dark:text-accent">
          {viewDetailsLabel}
          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </p>
      </div>
    </>
  );
}

function PublicationTile({
  pub,
  comingSoonLabel,
  externalAvailableLabel,
  priority = false,
  viewDetailsLabel,
}: {
  pub: Publication;
  comingSoonLabel: string;
  externalAvailableLabel: string;
  priority?: boolean;
  viewDetailsLabel: string;
}) {
  const { language, t } = useLanguage();
  const baseClass = surfacePanelClassName({
    rounded: "lg",
    interactive: true,
    className:
      "group relative flex flex-col justify-between overflow-hidden p-5 md:p-6",
  });
  const statusLabel =
    pub.status === "published"
      ? t("publications.status.published")
      : t("publications.status.forthcoming");

  return (
    <Link
      href={getPublicationPath(pub.id, language)}
      prefetch={false}
      id={pub.id}
      className={`${baseClass} app-anchor-section scroll-mt-28 cursor-pointer`}
    >
      <TileInner
        pub={pub}
        comingSoonLabel={comingSoonLabel}
        externalAvailableLabel={externalAvailableLabel}
        formatLabel={getPublicationFormatLabel(pub, language)}
        priority={priority}
        statusLabel={statusLabel}
        viewDetailsLabel={viewDetailsLabel}
      />
    </Link>
  );
}

export default function PublicationsPageClient() {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<PublicationLanguageFilter>("ALL");
  const [selectedStatus, setSelectedStatus] =
    useState<PublicationStatusFilter>("ALL");
  const [isFiltersExpandedOnMobile, setIsFiltersExpandedOnMobile] =
    useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const activeFilterCount = [
    selectedLanguage !== "ALL",
    selectedStatus !== "ALL",
  ].filter(Boolean).length;
  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedLanguage !== "ALL" ||
    selectedStatus !== "ALL";
  const mobileFilterToggleLabel = isFiltersExpandedOnMobile
    ? t("publications.hideFilters")
    : t("publications.showFilters");
  const filteredPublications = useMemo(
    () =>
      publications.filter((publication) => {
        if (
          selectedLanguage !== "ALL" &&
          publication.lang !== selectedLanguage
        ) {
          return false;
        }

        if (selectedStatus !== "ALL" && publication.status !== selectedStatus) {
          return false;
        }

        if (normalizedQuery.length === 0) {
          return true;
        }

        const searchableText = [
          publication.title,
          publication.subtitle,
          publication.lang,
          publication.status,
          publication.schemaType,
          publication.summary[language],
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();

        return searchableText.includes(normalizedQuery);
      }),
    [language, normalizedQuery, selectedLanguage, selectedStatus],
  );
  const publishedCount = publications.filter(
    (publication) => publication.status === "published",
  ).length;
  const forthcomingCount = publications.length - publishedCount;

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-content"
      width="standard"
      accents={[
        pageShellAccents.heroGoldBand,
        pageShellAccents.topRightCopticWashInset,
      ]}
    >
      <AppPageIntro
        align="center"
        breadcrumbs={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.publications") },
        ]}
        description={t("publications.indexDescription")}
        title={t("nav.publications")}
      />

      <div className="space-y-8 md:space-y-9">
        <section className="grid gap-3 md:grid-cols-3">
          <CatalogStat
            icon={BookOpen}
            label={t("publications.catalogLabel")}
            value={getCountLabel(
              publications.length,
              t("publications.item"),
              t("publications.items"),
            )}
          />
          <CatalogStat
            icon={FileText}
            label={t("publications.status.published")}
            value={getCountLabel(
              publishedCount,
              t("publications.item"),
              t("publications.items"),
            )}
          />
          <CatalogStat
            icon={FileClock}
            label={t("publications.status.forthcoming")}
            value={getCountLabel(
              forthcomingCount,
              t("publications.item"),
              t("publications.items"),
            )}
          />
        </section>

        <SurfacePanel
          rounded="lg"
          shadow="soft"
          variant="elevated"
          className="space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <label className="block space-y-0 sm:col-span-2 sm:space-y-2 md:col-span-1">
              <span className="sr-only text-xs font-semibold uppercase tracking-widest text-muted sm:not-sr-only sm:block">
                {t("publications.filters")}
              </span>
              <span className="relative block">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/65"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("publications.searchPlaceholder")}
                  className="input-base h-11 pl-10 pr-10 text-sm"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={t("publications.clearSearch")}
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer select-none items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </span>
            </label>

            <div
              className={cx(
                "gap-3 sm:contents",
                isFiltersExpandedOnMobile ? "grid" : "hidden",
              )}
            >
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {t("publications.status")}
                </span>
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value as PublicationStatusFilter,
                    )
                  }
                  className="compact-select-base sm:min-w-44"
                >
                  {statusFilterOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "ALL"
                        ? t("publications.status.all")
                        : t(`publications.status.${status}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {t("publications.language")}
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(event) =>
                    setSelectedLanguage(
                      event.target.value as PublicationLanguageFilter,
                    )
                  }
                  className="compact-select-base sm:min-w-40"
                >
                  {languageFilterOptions.map((languageOption) => (
                    <option key={languageOption} value={languageOption}>
                      {languageOption === "ALL"
                        ? t("publications.language.all")
                        : languageOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 pt-3 sm:hidden">
            <button
              type="button"
              aria-expanded={isFiltersExpandedOnMobile}
              aria-label={mobileFilterToggleLabel}
              onClick={() =>
                setIsFiltersExpandedOnMobile((current) => !current)
              }
              className="btn-ghost h-9 px-2 text-xs uppercase tracking-widest sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{t("publications.filterToggle")}</span>
              {activeFilterCount > 0 ? (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-semibold text-paper dark:bg-elevated dark:text-ink dark:ring-1 dark:ring-line"
                  aria-label={`${t("publications.activeFilters")}: ${activeFilterCount}`}
                >
                  {activeFilterCount}
                </span>
              ) : null}
              {isFiltersExpandedOnMobile ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedLanguage("ALL");
                  setSelectedStatus("ALL");
                }}
                className="btn-ghost h-9 px-3 text-xs uppercase tracking-widest"
              >
                {t("publications.clearFilters")}
              </button>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <div className="hidden justify-end border-t border-line/80 pt-4 sm:flex">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedLanguage("ALL");
                  setSelectedStatus("ALL");
                }}
                className="btn-ghost h-9 px-3 text-xs uppercase tracking-widest"
              >
                {t("publications.clearFilters")}
              </button>
            </div>
          ) : null}
        </SurfacePanel>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPublications.map((pub, i) => (
            <PublicationTile
              key={pub.id}
              pub={pub}
              comingSoonLabel={t("home.comingSoon")}
              externalAvailableLabel={t("publications.externalAvailable")}
              priority={i === 0}
              viewDetailsLabel={t("publications.viewDetails")}
            />
          ))}
        </div>

        {filteredPublications.length === 0 ? (
          <EmptyState
            title={t("publications.noResults")}
            description={t("publications.noResultsDesc")}
          />
        ) : null}
      </div>
    </PageShell>
  );
}
