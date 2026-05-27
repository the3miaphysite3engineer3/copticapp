import { redirect } from "next/navigation";

import { PracticePageClient } from "@/features/practice/components/PracticePageClient";
import {
  isFlashcardDeckId,
  isPrivateFlashcardDeckId,
} from "@/features/practice/lib/deckRegistry";
import { DEFAULT_PRACTICE_DECK_ID } from "@/features/practice/lib/practiceDeckDefaults";
import { loadPracticePageData } from "@/features/practice/lib/server/pageData";
import { normalizeFlashcardStudyMode } from "@/features/practice/lib/studyFlow";
import { getTranslation } from "@/lib/i18n";
import { getPracticePath } from "@/lib/locale";
import { createNoIndexMetadata } from "@/lib/metadata";
import { resolvePublicLocale } from "@/lib/publicLocaleRouting";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import {
  getAuthUnavailableLoginPath,
  getLoginPath,
  hasSupabaseRuntimeEnv,
} from "@/lib/supabase/config";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolvePublicLocale(locale);

  return createNoIndexMetadata({
    title: getTranslation(resolvedLocale, "practice.metaTitle"),
    description: getTranslation(resolvedLocale, "practice.metaDescription"),
  });
}

/**
 * Renders practice sets. Generated and mixed sets are public; saved entries use
 * authenticated persistence.
 */
export default async function LocalizedPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    deck?: string | string[];
    mode?: string | string[];
  }>;
}) {
  const { locale } = await params;
  const { deck, mode } = await searchParams;
  const resolvedLocale = resolvePublicLocale(locale);
  const requestedDeck = Array.isArray(deck) ? deck[0] : deck;
  const requestedMode = Array.isArray(mode) ? mode[0] : mode;
  const initialStudyMode = normalizeFlashcardStudyMode(requestedMode);
  const requestedDeckId = isFlashcardDeckId(requestedDeck)
    ? requestedDeck
    : null;
  const authContext = await getAuthenticatedServerContext();
  const activeDeckId = requestedDeckId ?? DEFAULT_PRACTICE_DECK_ID;
  const basePracticePath = getPracticePath(resolvedLocale);
  const practiceSearchParams = new URLSearchParams();

  if (!isPrivateFlashcardDeckId(activeDeckId)) {
    practiceSearchParams.set("deck", activeDeckId);
  }

  if (initialStudyMode) {
    practiceSearchParams.set("mode", initialStudyMode);
  }

  const practiceQuery = practiceSearchParams.toString();
  const practicePath = practiceQuery
    ? `${basePracticePath}?${practiceQuery}`
    : basePracticePath;

  if (!authContext && isPrivateFlashcardDeckId(activeDeckId)) {
    redirect(
      hasSupabaseRuntimeEnv()
        ? getLoginPath(practicePath)
        : getAuthUnavailableLoginPath(practicePath),
    );
  }

  const pageData = await loadPracticePageData({
    activeDeckId,
    locale: resolvedLocale,
    supabase: authContext?.supabase,
    user: authContext?.user,
  });

  if (!pageData) {
    redirect(getLoginPath(practicePath));
  }

  return (
    <PracticePageClient
      key={pageData.activeDeckId}
      activeDeck={pageData.activeDeck}
      activeDeckId={pageData.activeDeckId}
      deckOptions={pageData.deckOptions}
      initialStudyMode={initialStudyMode}
      isPersistenceEnabled={pageData.isAuthenticated}
      items={pageData.deck.items}
      nextDueAt={pageData.deck.nextDueAt}
      privateDeckLoginPath={getLoginPath(basePracticePath)}
      stats={pageData.deck.stats}
      storageError={pageData.storageError?.message ?? null}
    />
  );
}
