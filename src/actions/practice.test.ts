import { beforeEach, describe, expect, it, vi } from "vitest";

const PRACTICE_ITEM_ID = "00000000-0000-4000-8000-000000000001";
const REVIEW_ID = "00000000-0000-4000-8000-000000000002";

type PracticeActionModuleContext = {
  ensurePracticeItemForSource: typeof import("./practice").ensurePracticeItemForSource;
  ensureUserPracticeItemMock: ReturnType<typeof vi.fn>;
  getAuthenticatedServerContextMock: ReturnType<typeof vi.fn>;
  getDictionaryEntryByIdMock: ReturnType<typeof vi.fn>;
  getUserPracticeItemByIdMock: ReturnType<typeof vi.fn>;
  hasSupabaseRuntimeEnvMock: ReturnType<typeof vi.fn>;
  recordUserPracticeReviewMock: ReturnType<typeof vi.fn>;
  submitPracticeReview: typeof import("./practice").submitPracticeReview;
};

function createDictionaryEntry() {
  return {
    id: 10,
    headword: "ⲣⲱⲙⲉ",
    dialects: {
      B: {
        absolute: "ⲣⲱⲙⲓ",
      },
    },
    etym: "Egy",
    senses: [
      {
        grammar: { gender: "M", pos: "N" },
        meanings: {
          en: ["man"],
          nl: ["man"],
        },
      },
    ],
  };
}

function createPracticeItemRow(overrides: Record<string, unknown> = {}) {
  return {
    created_at: "2026-05-26T10:00:00.000Z",
    display_dialect: "B",
    due_at: "2026-05-26T10:00:00.000Z",
    id: PRACTICE_ITEM_ID,
    locale: "en",
    scheduler_card: {
      difficulty: 0,
      due: "2026-05-26T10:00:00.000Z",
      elapsed_days: 0,
      lapses: 0,
      learning_steps: 0,
      reps: 0,
      scheduled_days: 0,
      stability: 0,
      state: 0,
    },
    source_id: "10",
    source_type: "dictionary",
    suspended_at: null,
    template: "coptic_to_meaning",
    updated_at: "2026-05-26T10:00:00.000Z",
    user_id: "user-123",
    variant_key: "B",
    ...overrides,
  };
}

function createEnsureFormData(
  overrides?: Partial<
    Record<
      | "entryId"
      | "language"
      | "selectedDialect"
      | "sourceId"
      | "sourceType"
      | "template"
      | "variantKey",
      string
    >
  >,
) {
  const formData = new FormData();
  formData.set("language", overrides?.language ?? "en");
  formData.set("entryId", overrides?.entryId ?? overrides?.sourceId ?? "10");
  formData.set("selectedDialect", overrides?.selectedDialect ?? "B");
  if (overrides?.sourceId) {
    formData.set("sourceId", overrides.sourceId);
  }
  if (overrides?.sourceType) {
    formData.set("sourceType", overrides.sourceType);
  }
  if (overrides?.variantKey) {
    formData.set("variantKey", overrides.variantKey);
  }
  if (overrides?.template) {
    formData.set("template", overrides.template);
  }
  return formData;
}

function createReviewFormData(
  overrides?: Partial<Record<"practiceItemId" | "language" | "rating", string>>,
) {
  const formData = new FormData();
  formData.set("language", overrides?.language ?? "en");
  formData.set("practiceItemId", overrides?.practiceItemId ?? PRACTICE_ITEM_ID);
  formData.set("rating", overrides?.rating ?? "good");
  return formData;
}

async function loadPracticeActionModule(options?: {
  authContext?: null | {
    supabase: unknown;
    user: {
      id: string;
    };
  };
  dictionaryEntry?: ReturnType<typeof createDictionaryEntry> | null;
  ensureResult?: {
    data: unknown;
    error: { message: string } | null;
  };
  practiceItemResult?: {
    data: unknown;
    error: { message: string } | null;
  };
  hasEnv?: boolean;
  reviewResult?: {
    data: unknown;
    error: { message: string } | null;
  };
}) {
  vi.resetModules();

  const practiceItemRow = createPracticeItemRow();
  const reviewRow = {
    id: REVIEW_ID,
    locale: "en",
    practice_item_id: PRACTICE_ITEM_ID,
    rating: "good",
    reviewed_at: "2026-05-26T10:05:00.000Z",
    scheduler_card: {},
    scheduler_log: {},
    source_id: "10",
    source_type: "dictionary",
    template: "coptic_to_meaning",
    user_id: "user-123",
    variant_key: "B",
  };
  const getDictionaryEntryByIdMock = vi
    .fn()
    .mockReturnValue(
      options?.dictionaryEntry === undefined
        ? createDictionaryEntry()
        : options.dictionaryEntry,
    );
  const hasSupabaseRuntimeEnvMock = vi
    .fn()
    .mockReturnValue(options?.hasEnv ?? true);
  const getAuthenticatedServerContextMock = vi.fn().mockResolvedValue(
    options?.authContext === undefined
      ? {
          supabase: {},
          user: {
            id: "user-123",
          },
        }
      : options.authContext,
  );
  const ensureUserPracticeItemMock = vi
    .fn()
    .mockResolvedValue(
      options?.ensureResult ?? { data: practiceItemRow, error: null },
    );
  const getUserPracticeItemByIdMock = vi
    .fn()
    .mockResolvedValue(
      options?.practiceItemResult ?? { data: practiceItemRow, error: null },
    );
  const recordUserPracticeReviewMock = vi.fn().mockResolvedValue(
    options?.reviewResult ?? {
      data: {
        dueAt: "2026-05-26T10:15:00.000Z",
        practiceItem: createPracticeItemRow({
          due_at: "2026-05-26T10:15:00.000Z",
        }),
        review: reviewRow,
        reviewedAt: "2026-05-26T10:05:00.000Z",
      },
      error: null,
    },
  );

  vi.doMock("@/features/dictionary/lib/dictionary", () => ({
    getDictionaryEntryById: getDictionaryEntryByIdMock,
  }));
  vi.doMock("@/lib/supabase/auth", () => ({
    getAuthenticatedServerContext: getAuthenticatedServerContextMock,
  }));
  vi.doMock("@/lib/supabase/config", () => ({
    hasSupabaseRuntimeEnv: hasSupabaseRuntimeEnvMock,
  }));
  vi.doMock("@/features/practice/lib/server/persistence", () => ({
    ensureUserPracticeItem: ensureUserPracticeItemMock,
    getUserPracticeItemById: getUserPracticeItemByIdMock,
    recordUserPracticeReview: recordUserPracticeReviewMock,
  }));

  const mod = await import("./practice");

  return {
    ...mod,
    ensureUserPracticeItemMock,
    getAuthenticatedServerContextMock,
    getDictionaryEntryByIdMock,
    getUserPracticeItemByIdMock,
    hasSupabaseRuntimeEnvMock,
    recordUserPracticeReviewMock,
  } satisfies PracticeActionModuleContext;
}

describe("practice actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects entries that cannot produce practice items before auth", async () => {
    const {
      ensurePracticeItemForSource,
      ensureUserPracticeItemMock,
      getAuthenticatedServerContextMock,
    } = await loadPracticeActionModule({ dictionaryEntry: null });

    await expect(
      ensurePracticeItemForSource(null, createEnsureFormData()),
    ).resolves.toEqual({
      success: false,
      error: "This material cannot be turned into practice.",
    });

    expect(getAuthenticatedServerContextMock).not.toHaveBeenCalled();
    expect(ensureUserPracticeItemMock).not.toHaveBeenCalled();
  });

  it("returns a localized storage error when Supabase is unavailable", async () => {
    const { ensurePracticeItemForSource, getAuthenticatedServerContextMock } =
      await loadPracticeActionModule({ hasEnv: false });

    await expect(
      ensurePracticeItemForSource(
        null,
        createEnsureFormData({ language: "nl" }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "Oefenen is nog niet geconfigureerd.",
    });

    expect(getAuthenticatedServerContextMock).not.toHaveBeenCalled();
  });

  it("requires auth before materializing a practice item", async () => {
    const { ensurePracticeItemForSource, ensureUserPracticeItemMock } =
      await loadPracticeActionModule({ authContext: null });

    await expect(
      ensurePracticeItemForSource(null, createEnsureFormData()),
    ).resolves.toEqual({
      success: false,
      error: "Please sign in before saving practice progress.",
    });

    expect(ensureUserPracticeItemMock).not.toHaveBeenCalled();
  });

  it("materializes a practice item from a dictionary entry", async () => {
    const { ensurePracticeItemForSource, ensureUserPracticeItemMock } =
      await loadPracticeActionModule();

    await expect(
      ensurePracticeItemForSource(null, createEnsureFormData()),
    ).resolves.toEqual({
      dueAt: "2026-05-26T10:00:00.000Z",
      practiceItemId: PRACTICE_ITEM_ID,
      success: true,
    });

    expect(ensureUserPracticeItemMock).toHaveBeenCalledWith(
      {},
      "user-123",
      expect.objectContaining({
        entryId: 10,
        language: "en",
        selectedDialect: "B",
        template: "coptic_to_meaning",
      }),
    );
  });

  it("materializes the requested advanced card template", async () => {
    const { ensurePracticeItemForSource, ensureUserPracticeItemMock } =
      await loadPracticeActionModule();

    await expect(
      ensurePracticeItemForSource(
        null,
        createEnsureFormData({ template: "meaning_to_coptic" }),
      ),
    ).resolves.toMatchObject({
      practiceItemId: PRACTICE_ITEM_ID,
      success: true,
    });

    expect(ensureUserPracticeItemMock).toHaveBeenCalledWith(
      {},
      "user-123",
      expect.objectContaining({
        template: "meaning_to_coptic",
        front: expect.objectContaining({ kind: "meaning" }),
        back: expect.objectContaining({ kind: "coptic" }),
      }),
    );
  });

  it("materializes a practice item from a grammar seed", async () => {
    const { ensurePracticeItemForSource, ensureUserPracticeItemMock } =
      await loadPracticeActionModule();

    await expect(
      ensurePracticeItemForSource(
        null,
        createEnsureFormData({
          sourceId: "grammar.flashcard.lesson01.nominal-sentence.they-are-men",
          sourceType: "grammar",
          template: "grammar_translation_to_coptic",
          variantKey: "default",
        }),
      ),
    ).resolves.toEqual({
      dueAt: "2026-05-26T10:00:00.000Z",
      practiceItemId: PRACTICE_ITEM_ID,
      success: true,
    });

    expect(ensureUserPracticeItemMock).toHaveBeenCalledWith(
      {},
      "user-123",
      expect.objectContaining({
        sourceId: "grammar.flashcard.lesson01.nominal-sentence.they-are-men",
        sourceType: "grammar",
        template: "grammar_translation_to_coptic",
      }),
    );
  });

  it("rejects invalid review payloads before loading stored cards", async () => {
    const { getUserPracticeItemByIdMock, submitPracticeReview } =
      await loadPracticeActionModule();

    await expect(
      submitPracticeReview(
        null,
        createReviewFormData({
          practiceItemId: "not-a-uuid",
          rating: "manual",
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "Please submit a valid practice review.",
    });

    expect(getUserPracticeItemByIdMock).not.toHaveBeenCalled();
  });

  it("records a practice review for the authenticated user", async () => {
    const {
      getUserPracticeItemByIdMock,
      recordUserPracticeReviewMock,
      submitPracticeReview,
    } = await loadPracticeActionModule();

    await expect(
      submitPracticeReview(null, createReviewFormData()),
    ).resolves.toEqual({
      dueAt: "2026-05-26T10:15:00.000Z",
      practiceItemId: PRACTICE_ITEM_ID,
      message: "Practice review saved.",
      reviewedAt: "2026-05-26T10:05:00.000Z",
      reviewId: REVIEW_ID,
      success: true,
    });

    expect(getUserPracticeItemByIdMock).toHaveBeenCalledWith(
      {},
      "user-123",
      PRACTICE_ITEM_ID,
    );
    expect(recordUserPracticeReviewMock).toHaveBeenCalledWith(
      {},
      "user-123",
      expect.objectContaining({ id: PRACTICE_ITEM_ID }),
      "good",
    );
  });

  it("returns not found when the practice item is not owned by the user", async () => {
    const { recordUserPracticeReviewMock, submitPracticeReview } =
      await loadPracticeActionModule({
        practiceItemResult: { data: null, error: null },
      });

    await expect(
      submitPracticeReview(null, createReviewFormData()),
    ).resolves.toEqual({
      success: false,
      error: "This practice item could not be found.",
    });

    expect(recordUserPracticeReviewMock).not.toHaveBeenCalled();
  });
});
