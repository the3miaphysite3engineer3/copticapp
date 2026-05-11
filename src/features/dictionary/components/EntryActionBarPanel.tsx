"use client";

import { Heart, Flag, Loader2, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { AuthGatedActionButton } from "@/components/AuthGatedActionButton";
import { useLanguage } from "@/components/LanguageProvider";
import { StatusNotice } from "@/components/StatusNotice";
import type { LexicalEntry } from "@/features/dictionary/types";
import { cx } from "@/lib/classes";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";

import { EntryReportPanel } from "./EntryReportPanel";
import { EntrySharePanel } from "./EntrySharePanel";
import { ENTRY_FAVORITE_ERROR_LABEL_KEYS } from "../lib/entryActionBar";
import { useEntryActionBarState } from "../lib/useEntryActionBarState";
import { useEntryFavorite } from "../lib/useEntryFavorite";
import { useEntryShareActions } from "../lib/useEntryShareActions";

type EntryActionBarProps = {
  compact?: boolean;
  entry: LexicalEntry;
  initialIntent?: "favorite" | "report" | "share";
  parentEntry?: LexicalEntry | null;
  relatedEntries?: readonly LexicalEntry[];
};

const compactActionButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-100";

export function EntryActionBarPanel({
  compact = false,
  entry,
  initialIntent,
  parentEntry = null,
  relatedEntries = [],
}: EntryActionBarProps) {
  const { language, t } = useLanguage();
  const authGate = useOptionalAuthGate();
  const {
    activeLockedAction,
    closeReportPanel,
    handleFavoriteClick,
    handleLockedActionOpenChange,
    handleReportSubmitted,
    isReportOpen,
    isShareOpen,
    reportNotice,
    setShareNotice,
    shareNotice,
    toggleReportPanel,
    toggleSharePanel,
  } = useEntryActionBarState();
  const {
    errorCode,
    isFavorited,
    isLoading,
    isPending,
    pendingAction,
    toggleFavorite,
  } = useEntryFavorite(entry.id, authGate.user?.id ?? null);
  const {
    canUseNativeShare,
    copyLink,
    copyText,
    nativeShare,
    shareLinks,
    sharePayload,
  } = useEntryShareActions({
    entry,
    language,
    onNoticeChange: setShareNotice,
    parentEntry,
    relatedEntries,
  });
  const initialIntentAppliedRef = useRef(false);

  const lockedMessage = authGate.authAvailable
    ? t("entry.actions.loginPrompt")
    : t("entry.actions.authUnavailable");
  const favoriteErrorMessage = errorCode
    ? t(ENTRY_FAVORITE_ERROR_LABEL_KEYS[errorCode])
    : null;
  const isReportPanelVisible = authGate.isAuthenticated && isReportOpen;
  const sharePanelId = `entry-share-panel-${entry.id}`;
  let favoriteLabel = t("entry.actions.favorite");

  if (isLoading) {
    favoriteLabel = t("entry.actions.favoriteLoading");
  } else if (isPending) {
    favoriteLabel =
      pendingAction === "remove"
        ? t("entry.actions.favoriteRemoving")
        : t("entry.actions.favoriteSaving");
  } else if (isFavorited) {
    favoriteLabel = t("entry.actions.favorited");
  }

  useEffect(() => {
    if (!initialIntent || initialIntentAppliedRef.current) {
      return;
    }

    initialIntentAppliedRef.current = true;

    if (initialIntent === "share") {
      toggleSharePanel();
      return;
    }

    if (initialIntent === "report") {
      if (authGate.isReady && authGate.isAuthenticated) {
        toggleReportPanel();
      } else {
        handleLockedActionOpenChange("report", true);
      }
      return;
    }

    if (!authGate.isAuthenticated) {
      handleLockedActionOpenChange("favorite", true);
    }
  }, [
    authGate.isAuthenticated,
    authGate.isReady,
    handleLockedActionOpenChange,
    initialIntent,
    toggleReportPanel,
    toggleSharePanel,
  ]);

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-controls={sharePanelId}
            aria-expanded={isShareOpen}
            aria-label={
              isShareOpen
                ? t("entry.actions.shareClose")
                : t("entry.actions.share")
            }
            title={
              isShareOpen
                ? t("entry.actions.shareClose")
                : t("entry.actions.share")
            }
            className={cx(
              compactActionButtonClassName,
              isShareOpen &&
                "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-300 dark:hover:bg-sky-950/40",
            )}
            onClick={toggleSharePanel}
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">
              {isShareOpen
                ? t("entry.actions.shareClose")
                : t("entry.actions.share")}
            </span>
          </button>

          <AuthGatedActionButton
            className={cx(
              compactActionButtonClassName,
              (isLoading || isPending) && "opacity-70",
              isFavorited &&
                "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300 dark:hover:bg-rose-950/40",
            )}
            disabled={isLoading || isPending}
            isAuthenticated={authGate.isAuthenticated}
            isReady={authGate.isReady}
            lockedContent={
              <>
                <Heart className="h-4 w-4" />
                <span className="sr-only">{favoriteLabel}</span>
              </>
            }
            lockedOpen={activeLockedAction === "favorite"}
            lockedMessage={lockedMessage}
            onLockedOpenChange={(visible) =>
              handleLockedActionOpenChange("favorite", visible)
            }
            onClick={() => {
              handleFavoriteClick();
              void toggleFavorite();
            }}
            title={favoriteLabel}
            aria-label={favoriteLabel}
          >
            {isLoading || isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={cx("h-4 w-4", isFavorited && "fill-current")} />
            )}
            <span className="sr-only">{favoriteLabel}</span>
          </AuthGatedActionButton>

          <AuthGatedActionButton
            className={cx(
              compactActionButtonClassName,
              isReportOpen &&
                "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300 dark:hover:bg-amber-950/40",
            )}
            isAuthenticated={authGate.isAuthenticated}
            isReady={authGate.isReady}
            lockedContent={
              <>
                <Flag className="h-4 w-4" />
                <span className="sr-only">
                  {isReportPanelVisible
                    ? t("entry.actions.reportClose")
                    : t("entry.actions.report")}
                </span>
              </>
            }
            lockedOpen={activeLockedAction === "report"}
            lockedMessage={lockedMessage}
            onLockedOpenChange={(visible) =>
              handleLockedActionOpenChange("report", visible)
            }
            onClick={toggleReportPanel}
            title={
              isReportPanelVisible
                ? t("entry.actions.reportClose")
                : t("entry.actions.report")
            }
            aria-label={
              isReportPanelVisible
                ? t("entry.actions.reportClose")
                : t("entry.actions.report")
            }
          >
            <Flag className="h-4 w-4" />
            <span className="sr-only">
              {isReportPanelVisible
                ? t("entry.actions.reportClose")
                : t("entry.actions.report")}
            </span>
          </AuthGatedActionButton>
        </div>

        {favoriteErrorMessage ? (
          <div className="w-full sm:w-[min(28rem,calc(100vw-6rem))]">
            <StatusNotice tone="error" align="left">
              {favoriteErrorMessage}
            </StatusNotice>
          </div>
        ) : null}

        {reportNotice ? (
          <div className="w-full sm:w-[min(28rem,calc(100vw-6rem))]">
            <StatusNotice tone={reportNotice.tone} align="left">
              {reportNotice.message}
            </StatusNotice>
          </div>
        ) : null}

        {isShareOpen ? (
          <div
            id={sharePanelId}
            className="w-full sm:w-[min(42rem,calc(100vw-6rem))]"
          >
            <EntrySharePanel
              canUseNativeShare={canUseNativeShare}
              notice={shareNotice}
              onCopyLink={() => void copyLink()}
              onCopyText={() => void copyText()}
              onNativeShare={() => void nativeShare()}
              shareLinks={shareLinks}
              sharePayload={sharePayload}
            />
          </div>
        ) : null}

        {isReportPanelVisible ? (
          <div className="w-full sm:w-[min(42rem,calc(100vw-6rem))]">
            <EntryReportPanel
              entry={entry}
              language={language}
              onClose={closeReportPanel}
              onSubmitted={handleReportSubmitted}
            />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            {t("entry.actions.eyebrow")}
          </p>
          <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
            {t("entry.actions.description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-controls={sharePanelId}
            aria-expanded={isShareOpen}
            className={cx(
              "btn-secondary gap-2 px-4",
              isShareOpen &&
                "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-300 dark:hover:bg-sky-950/40",
            )}
            onClick={toggleSharePanel}
          >
            <Share2 className="h-4 w-4" />
            {isShareOpen
              ? t("entry.actions.shareClose")
              : t("entry.actions.share")}
          </button>

          <AuthGatedActionButton
            className={cx(
              "btn-secondary gap-2 px-4",
              (isLoading || isPending) && "opacity-70",
              isFavorited &&
                "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300 dark:hover:bg-rose-950/40",
            )}
            disabled={isLoading || isPending}
            isAuthenticated={authGate.isAuthenticated}
            isReady={authGate.isReady}
            lockedOpen={activeLockedAction === "favorite"}
            lockedMessage={lockedMessage}
            onLockedOpenChange={(visible) =>
              handleLockedActionOpenChange("favorite", visible)
            }
            onClick={() => {
              handleFavoriteClick();
              void toggleFavorite();
            }}
          >
            {isLoading || isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={cx("h-4 w-4", isFavorited && "fill-current")} />
            )}
            {favoriteLabel}
          </AuthGatedActionButton>

          <AuthGatedActionButton
            className={cx(
              "btn-secondary gap-2 px-4",
              isReportOpen &&
                "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300 dark:hover:bg-amber-950/40",
            )}
            isAuthenticated={authGate.isAuthenticated}
            isReady={authGate.isReady}
            lockedOpen={activeLockedAction === "report"}
            lockedMessage={lockedMessage}
            onLockedOpenChange={(visible) =>
              handleLockedActionOpenChange("report", visible)
            }
            onClick={toggleReportPanel}
          >
            <Flag className="h-4 w-4" />
            {isReportPanelVisible
              ? t("entry.actions.reportClose")
              : t("entry.actions.report")}
          </AuthGatedActionButton>
        </div>
      </div>

      {favoriteErrorMessage ? (
        <StatusNotice tone="error" align="left">
          {favoriteErrorMessage}
        </StatusNotice>
      ) : null}

      {reportNotice ? (
        <StatusNotice tone={reportNotice.tone} align="left">
          {reportNotice.message}
        </StatusNotice>
      ) : null}

      {isShareOpen ? (
        <div id={sharePanelId}>
          <EntrySharePanel
            canUseNativeShare={canUseNativeShare}
            notice={shareNotice}
            onCopyLink={() => void copyLink()}
            onCopyText={() => void copyText()}
            onNativeShare={() => void nativeShare()}
            shareLinks={shareLinks}
            sharePayload={sharePayload}
          />
        </div>
      ) : null}

      {isReportPanelVisible ? (
        <EntryReportPanel
          entry={entry}
          language={language}
          onClose={closeReportPanel}
          onSubmitted={handleReportSubmitted}
        />
      ) : null}
    </div>
  );
}
