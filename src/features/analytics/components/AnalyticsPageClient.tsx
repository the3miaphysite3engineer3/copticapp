"use client";

import { ArrowLeft, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AppPageIntro } from "@/components/AppPageIntro";
import { buttonClassName } from "@/components/Button";
import { CompactSelect } from "@/components/CompactSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel, surfacePanelClassName } from "@/components/SurfacePanel";
import {
  type AnalyticsSnapshotMap,
  ETYMOLOGY_FILTERS,
  type EtymologyFilter,
} from "@/features/analytics/lib/analytics";
import {
  buildAnalyticsChartDrilldown,
  buildAnalyticsStatDrilldown,
  type AnalyticsDrilldownPage,
  type AnalyticsDrilldown,
} from "@/features/analytics/lib/analyticsDrilldown";
import { DictionaryResultsSection } from "@/features/dictionary/components/DictionaryResultsSection";
import {
  type AnalyticsDialect,
  dialectFilterOptions,
  getDialectFilterOptionLabel,
} from "@/features/dictionary/config";
import type { DictionaryClientEntry } from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import type { TranslationKey } from "@/lib/i18n";
import { getDictionaryPath, getLocalizedHomePath } from "@/lib/locale";

import { AnalyticsSlideOver } from "./AnalyticsSlideOver";

const ANALYTICS_DRILLDOWN_PAGE_SIZE = 50;

const AnalyticsChartsSection = dynamic(
  () =>
    import("./AnalyticsChartsSection").then((module) => ({
      default: module.AnalyticsChartsSection,
    })),
  {
    ssr: false,
    loading: () => <AnalyticsChartsPlaceholder />,
  },
);

type AnalyticsStatCardProps = {
  accentClassName: string;
  title: string;
  value: string;
  valueClassName?: string;
  onClick?: () => void;
};

type AnalyticsChartsCalloutProps = {
  description: string;
  loadLabel: string;
  onLoadCharts: () => void;
  title: string;
};

function getEtymologyFilterLabel(
  etymology: EtymologyFilter,
  t: ReturnType<typeof useLanguage>["t"],
) {
  switch (etymology) {
    case "ALL":
      return t("analytics.filterEtymologyAll" as TranslationKey);
    case "Egy":
      return t("analytics.filterEtymologyEgy" as TranslationKey);
    case "Gr":
      return t("analytics.filterEtymologyGr" as TranslationKey);
    case "Unknown":
      return t("analytics.filterEtymologyUnknown" as TranslationKey);
  }
}

function AnalyticsStatCard({
  accentClassName,
  title,
  value,
  valueClassName = "text-3xl font-bold text-ink md:text-4xl",
  onClick,
}: AnalyticsStatCardProps) {
  const cardContent = (
    <>
      <div
        className={cx(
          "absolute inset-y-4 left-0 w-1 rounded-r-full",
          accentClassName,
        )}
      />
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
        {title}
      </h2>
      <p className={valueClassName}>{value}</p>
    </>
  );

  if (!onClick) {
    return (
      <SurfacePanel
        rounded="2xl"
        variant="subtle"
        shadow="soft"
        className="relative overflow-hidden p-4 pl-5 md:p-5 md:pl-6"
      >
        {cardContent}
      </SurfacePanel>
    );
  }

  return (
    <button
      type="button"
      className={surfacePanelClassName({
        className: cx(
          "relative overflow-hidden text-left",
          "cursor-pointer select-none transition-all duration-200 hover:-translate-y-px hover:border-accent/40 hover:bg-surface active:translate-y-0 dark:hover:bg-elevated",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "p-4 pl-5 md:p-5 md:pl-6",
        ),
        rounded: "2xl",
        shadow: "soft",
        variant: "subtle",
      })}
      onClick={onClick}
    >
      {cardContent}
    </button>
  );
}

function AnalyticsChartsPlaceholder() {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
        <AnalyticsChartSkeletonCard />
        <AnalyticsChartSkeletonCard />
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start mb-8">
        <AnalyticsChartSkeletonCard />
        <AnalyticsChartSkeletonCard />
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <AnalyticsChartSkeletonCard />
        <AnalyticsChartSkeletonCard />
      </div>
    </>
  );
}

function AnalyticsChartSkeletonCard() {
  return (
    <SurfacePanel
      rounded="2xl"
      shadow="soft"
      className="flex h-full flex-col p-5"
    >
      <div className="mb-6 h-8 w-48 rounded-full bg-elevated/80" />
      <div className="h-[300px] w-full rounded-2xl bg-elevated/65" />
    </SurfacePanel>
  );
}

function AnalyticsChartsCallout({
  description,
  loadLabel,
  onLoadCharts,
  title,
}: AnalyticsChartsCalloutProps) {
  return (
    <SurfacePanel rounded="2xl" shadow="soft" className="p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
        <button
          type="button"
          className={buttonClassName({ variant: "primary" })}
          onClick={onLoadCharts}
        >
          {loadLabel}
        </button>
      </div>
    </SurfacePanel>
  );
}

type AnalyticsPageClientProps = {
  snapshots: AnalyticsSnapshotMap;
};

type AnalyticsChartClickPayload = {
  name?: string;
  payload?: {
    originalName?: string;
  };
};

function isAnalyticsChartClickPayload(
  value: unknown,
): value is AnalyticsChartClickPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AnalyticsChartClickPayload;
  return (
    candidate.payload === undefined || typeof candidate.payload === "object"
  );
}

/**
 * Serializes the active analytics drilldown state into the public API query
 * shape so the slide-over can request only the current page of entries.
 */
function buildAnalyticsDrilldownUrl(options: {
  drilldown: AnalyticsDrilldown;
  limit: number;
  offset: number;
  selectedDialect: AnalyticsDialect;
  selectedEtymology: EtymologyFilter;
}) {
  const params = new URLSearchParams({
    dialect: options.selectedDialect,
    etymology: options.selectedEtymology,
    kind: options.drilldown.kind,
    limit: String(options.limit),
    offset: String(options.offset),
    title: options.drilldown.title,
  });

  if (options.drilldown.kind === "stat") {
    params.set("statType", options.drilldown.type);
  } else {
    params.set("chartType", options.drilldown.chartType);
    params.set("originalName", options.drilldown.originalName);
  }

  return `/api/v1/analytics/drilldown?${params.toString()}`;
}

export default function AnalyticsPageClient({
  snapshots,
}: AnalyticsPageClientProps) {
  const [selectedDialect, setSelectedDialect] = useState<AnalyticsDialect>("B");
  const [selectedEtymology, setSelectedEtymology] =
    useState<EtymologyFilter>("ALL");
  const [slideOverFilter, setSlideOverFilter] =
    useState<AnalyticsDrilldown | null>(null);
  const [slideOverResults, setSlideOverResults] = useState<
    DictionaryClientEntry[]
  >([]);
  const [slideOverDictionaryLength, setSlideOverDictionaryLength] = useState(0);
  const [slideOverTotalMatches, setSlideOverTotalMatches] = useState(0);
  const [hasMoreSlideOverResults, setHasMoreSlideOverResults] = useState(false);
  const [isSlideOverLoading, setSlideOverLoading] = useState(false);
  const [isSlideOverLoadingMore, setSlideOverLoadingMore] = useState(false);
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);
  const activeDrilldownKeyRef = useRef("");

  const { language, t } = useLanguage();
  const stats =
    snapshots[selectedDialect]?.[selectedEtymology] ?? snapshots.ALL.ALL;

  useEffect(() => {
    if (!slideOverFilter) {
      activeDrilldownKeyRef.current = "";
      queueMicrotask(() => {
        setSlideOverResults([]);
        setSlideOverDictionaryLength(0);
        setSlideOverTotalMatches(0);
        setHasMoreSlideOverResults(false);
        setSlideOverLoading(false);
        setSlideOverLoadingMore(false);
      });
      return;
    }

    const activeSlideOverFilter = slideOverFilter;
    const controller = new AbortController();
    const requestKey = JSON.stringify({
      drilldown: activeSlideOverFilter,
      selectedDialect,
      selectedEtymology,
    });
    activeDrilldownKeyRef.current = requestKey;
    queueMicrotask(() => {
      setSlideOverLoading(true);
      setSlideOverLoadingMore(false);
    });

    async function loadDrilldownPage() {
      try {
        const response = await fetch(
          buildAnalyticsDrilldownUrl({
            drilldown: activeSlideOverFilter,
            limit: ANALYTICS_DRILLDOWN_PAGE_SIZE,
            offset: 0,
            selectedDialect,
            selectedEtymology,
          }),
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Analytics drilldown is unavailable");
        }

        const page = (await response.json()) as AnalyticsDrilldownPage;
        if (
          controller.signal.aborted ||
          activeDrilldownKeyRef.current !== requestKey
        ) {
          return;
        }

        setSlideOverDictionaryLength(page.totalEntries);
        setSlideOverResults(page.entries);
        setSlideOverTotalMatches(page.totalMatches);
        setHasMoreSlideOverResults(page.hasMore);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.warn("Analytics drilldown data is unavailable.", error);
        if (activeDrilldownKeyRef.current !== requestKey) {
          return;
        }

        setSlideOverDictionaryLength(0);
        setSlideOverResults([]);
        setSlideOverTotalMatches(0);
        setHasMoreSlideOverResults(false);
      } finally {
        if (
          controller.signal.aborted ||
          activeDrilldownKeyRef.current !== requestKey
        ) {
          return;
        }

        setSlideOverLoading(false);
      }
    }

    void loadDrilldownPage();

    return () => {
      controller.abort();
    };
  }, [selectedDialect, selectedEtymology, slideOverFilter]);

  const loadMoreSlideOverResults = () => {
    if (
      !slideOverFilter ||
      isSlideOverLoading ||
      isSlideOverLoadingMore ||
      !hasMoreSlideOverResults
    ) {
      return;
    }

    const activeSlideOverFilter = slideOverFilter;
    const requestKey = activeDrilldownKeyRef.current;
    setSlideOverLoadingMore(true);

    async function loadNextPage() {
      try {
        const response = await fetch(
          buildAnalyticsDrilldownUrl({
            drilldown: activeSlideOverFilter,
            limit: ANALYTICS_DRILLDOWN_PAGE_SIZE,
            offset: slideOverResults.length,
            selectedDialect,
            selectedEtymology,
          }),
        );
        if (!response.ok) {
          throw new Error("Analytics drilldown page is unavailable");
        }

        const page = (await response.json()) as AnalyticsDrilldownPage;
        if (activeDrilldownKeyRef.current !== requestKey) {
          return;
        }

        setSlideOverDictionaryLength(page.totalEntries);
        setSlideOverResults((previousResults) =>
          activeDrilldownKeyRef.current === requestKey
            ? [...previousResults, ...page.entries]
            : previousResults,
        );
        setSlideOverTotalMatches(page.totalMatches);
        setHasMoreSlideOverResults(page.hasMore);
      } catch (error) {
        console.warn(
          "Analytics drilldown results could not be extended.",
          error,
        );
      } finally {
        if (activeDrilldownKeyRef.current === requestKey) {
          setSlideOverLoadingMore(false);
        }
      }
    }

    void loadNextPage();
  };

  const handleStatClick = (type: "total" | "unknown" | "uncertain") => {
    setSlideOverFilter(
      buildAnalyticsStatDrilldown({
        totalTitle: t("analytics.totalRoots"),
        type,
        uncertainTitle: t("analytics.meaningUncertain"),
        unknownTitle: t("analytics.meaningUnknown"),
      }),
    );
  };

  const handleChartClick = (data: unknown, type: string) => {
    if (!isAnalyticsChartClickPayload(data) || !data.payload?.originalName) {
      return;
    }
    setSlideOverFilter(
      buildAnalyticsChartDrilldown({
        originalName: data.payload.originalName,
        title: data.name ?? data.payload.originalName,
        type: type as "derivation" | "etymology" | "gender" | "pos" | "verb",
      }),
    );
  };

  const chartsContent = shouldRenderCharts ? (
    <AnalyticsChartsSection onChartClick={handleChartClick} stats={stats} />
  ) : (
    <AnalyticsChartsCallout
      description={t("analytics.mobileChartsDescription" as TranslationKey)}
      loadLabel={t("analytics.loadCharts" as TranslationKey)}
      onLoadCharts={() => setShouldRenderCharts(true)}
      title={t("analytics.visualBreakdowns" as TranslationKey)}
    />
  );

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-content"
      width="standard"
      accents={[
        pageShellAccents.heroCopticBand,
        pageShellAccents.topRightGoldWashInset,
      ]}
    >
      <AppPageIntro
        align="left"
        breadcrumbs={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.dictionary"), href: getDictionaryPath(language) },
          { label: t("nav.analytics") },
        ]}
        actions={
          <>
            <Link
              href={getDictionaryPath(language)}
              prefetch={false}
              className={buttonClassName({ variant: "secondary" })}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("analytics.back")}
            </Link>

            <div className="flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface/88 p-2 shadow-sm backdrop-blur-md sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 px-2">
                <span className="inline-flex items-center whitespace-nowrap text-muted">
                  <Filter className="h-4 w-4" />
                </span>
                <CompactSelect
                  id="analytics-dialect-filter"
                  label={t("analytics.filter")}
                  name="dialect"
                  value={selectedDialect}
                  onChange={(e) =>
                    setSelectedDialect(e.target.value as AnalyticsDialect)
                  }
                  className="text-ink"
                >
                  {dialectFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {getDialectFilterOptionLabel(option.value, t)}
                    </option>
                  ))}
                </CompactSelect>
              </div>

              <div className="flex items-center gap-2 px-2">
                <CompactSelect
                  id="analytics-etymology-filter"
                  label={t("analytics.filterEtymology" as TranslationKey)}
                  name="etymology"
                  value={selectedEtymology}
                  onChange={(e) =>
                    setSelectedEtymology(e.target.value as EtymologyFilter)
                  }
                  className="text-ink"
                >
                  {ETYMOLOGY_FILTERS.map((etymology) => (
                    <option key={etymology} value={etymology}>
                      {getEtymologyFilterLabel(etymology, t)}
                    </option>
                  ))}
                </CompactSelect>
              </div>
            </div>
          </>
        }
        actionsPlacement="below"
        title={t("analytics.title")}
        tone="analytics"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--accent)/0.12)]"
          title={t("analytics.totalRoots")}
          value={stats.totalRoots.toLocaleString()}
          onClick={() => handleStatClick("total")}
        />
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--warning)/0.12)]"
          title={t("analytics.meaningUnknown")}
          value={stats.unknownMeaning.toLocaleString()}
          valueClassName="text-3xl font-bold text-ink"
          onClick={() => handleStatClick("unknown")}
        />
        <AnalyticsStatCard
          accentClassName="bg-[rgb(var(--danger)/0.12)]"
          title={t("analytics.meaningUncertain")}
          value={stats.uncertainMeaning.toLocaleString()}
          valueClassName="text-3xl font-bold text-ink"
          onClick={() => handleStatClick("uncertain")}
        />
      </div>

      <div>{chartsContent}</div>

      <AnalyticsSlideOver
        isOpen={!!slideOverFilter}
        onClose={() => setSlideOverFilter(null)}
        title={slideOverFilter?.title ?? "Details"}
      >
        <DictionaryResultsSection
          dictionaryLength={slideOverDictionaryLength}
          filteredResults={slideOverResults}
          hasMoreResults={hasMoreSlideOverResults}
          loading={Boolean(slideOverFilter) && isSlideOverLoading}
          loadingMore={isSlideOverLoadingMore}
          onLoadMore={loadMoreSlideOverResults}
          query=""
          selectedDialect={selectedDialect}
          selectedPartOfSpeech="ALL"
          scrollContainerId="analytics-slideover-scroll"
          totalMatches={slideOverTotalMatches}
        />
      </AnalyticsSlideOver>
    </PageShell>
  );
}
