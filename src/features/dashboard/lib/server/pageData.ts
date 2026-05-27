import type { EntryFavoriteWithEntry } from "@/features/dictionary/lib/entryActions";
import { getUserEntryFavorites } from "@/features/dictionary/lib/server/queries";
import {
  getPublishedGrammarLessonBundleBySlug,
  listPublishedGrammarLessons,
} from "@/features/grammar/lib/grammarDataset";
import {
  buildGrammarLessonLearnerSummary,
  type GrammarLessonLearnerSummary,
} from "@/features/grammar/lib/grammarLearnerState";
import {
  getUserLessonBookmarks,
  getUserLessonNotes,
  getUserLessonProgressRows,
  getUserSectionProgressRows,
} from "@/features/grammar/lib/server/queries";
import {
  buildSavedDictionaryEntries,
  loadSavedEntriesPracticeDeck,
} from "@/features/practice/lib/server/pageData";
import { getAccountAuthSettings } from "@/features/profile/lib/accountSettings";
import {
  getAudienceContactForProfile,
  getProfile,
} from "@/features/profile/lib/server/queries";
import { getUserSubmissions } from "@/features/submissions/lib/server/queries";
import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type { Language } from "@/types/i18n";
import type { Tables } from "@/types/supabase";

import type { User } from "@supabase/supabase-js";

type DashboardPageData = {
  audienceContact: Awaited<ReturnType<typeof getAudienceContactForProfile>>;
  canUpdatePassword: boolean;
  practice: Awaited<ReturnType<typeof loadSavedEntriesPracticeDeck>>;
  grammarLessonSummaries: GrammarLessonLearnerSummary[];
  profile: Tables<"profiles">;
  providerLabel: string;
  savedDictionaryEntries: EntryFavoriteWithEntry[];
  submissions: Awaited<ReturnType<typeof getUserSubmissions>>;
};

/**
 * Builds learner-facing lesson summaries by combining the published grammar
 * lesson dataset with the user's bookmarks, notes, and progress rows.
 */
function buildGrammarLessonSummaries({
  lessonBookmarks,
  lessonNotes,
  lessonProgressRows,
  sectionProgressRows,
}: {
  lessonBookmarks: Awaited<ReturnType<typeof getUserLessonBookmarks>>;
  lessonNotes: Awaited<ReturnType<typeof getUserLessonNotes>>;
  lessonProgressRows: Awaited<ReturnType<typeof getUserLessonProgressRows>>;
  sectionProgressRows: Awaited<ReturnType<typeof getUserSectionProgressRows>>;
}) {
  return listPublishedGrammarLessons()
    .map((lesson) => getPublishedGrammarLessonBundleBySlug(lesson.slug))
    .filter(
      (lessonBundle): lessonBundle is NonNullable<typeof lessonBundle> =>
        lessonBundle !== null,
    )
    .map((lessonBundle) =>
      buildGrammarLessonLearnerSummary({
        bookmarkRows: lessonBookmarks,
        lessonBundle,
        lessonNoteRows: lessonNotes,
        lessonProgressRows,
        sectionProgressRows,
      }),
    );
}

/**
 * Loads the user dashboard read model, combining profile, audience, progress,
 * saved entries, and submissions into one server-side payload.
 */
export async function loadDashboardPageData({
  locale,
  supabase,
  user,
}: {
  locale: Language;
  supabase: AppSupabaseClient;
  user: User;
}): Promise<DashboardPageData | null> {
  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return null;
  }

  const [
    audienceContact,
    submissions,
    lessonProgressRows,
    sectionProgressRows,
    entryFavorites,
    lessonBookmarks,
    lessonNotes,
  ] = await Promise.all([
    getAudienceContactForProfile(supabase, user.id, profile.email),
    getUserSubmissions(supabase, user.id),
    getUserLessonProgressRows(supabase, user.id),
    getUserSectionProgressRows(supabase, user.id),
    getUserEntryFavorites(supabase, user.id),
    getUserLessonBookmarks(supabase, user.id),
    getUserLessonNotes(supabase, user.id),
  ]);

  const { canUpdatePassword, providerLabel } = getAccountAuthSettings(
    user.app_metadata,
    locale,
  );
  const savedDictionaryEntries = buildSavedDictionaryEntries(entryFavorites);
  const practice = await loadSavedEntriesPracticeDeck({
    locale,
    preferredDialect: profile.preferred_dictionary_dialect,
    savedDictionaryEntries,
    supabase,
    userId: user.id,
  });

  return {
    audienceContact,
    canUpdatePassword,
    practice,
    grammarLessonSummaries: buildGrammarLessonSummaries({
      lessonBookmarks,
      lessonNotes,
      lessonProgressRows,
      sectionProgressRows,
    }),
    profile,
    providerLabel,
    savedDictionaryEntries,
    submissions,
  };
}
