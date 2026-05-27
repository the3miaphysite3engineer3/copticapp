import type { Database } from "@/types/supabase";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The typed Supabase client shape used throughout app queries and actions.
 */
export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * A lightweight query-result shape used by helpers that normalize data/error
 * responses outside the full Supabase client API.
 */
export type QueryResult<T> = {
  data: T | null;
  error: { code?: string | null; message: string } | null;
};
