import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/supabase/authQueries";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

type SavedChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<{ text: string; type: "text" }>;
};

type SavedChatRow = {
  client_message_id: string | null;
  content: string;
  id: string;
  metadata: {
    parts?: SavedChatMessage["parts"] | null;
  } | null;
  role: SavedChatMessage["role"];
};

type HistoryRequestPayload = {
  sessionId?: unknown;
  messages?: unknown;
};

function toOptionalUuidString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return isUuid(normalized) ? normalized : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isSavedChatRole(value: unknown): value is SavedChatMessage["role"] {
  return value === "assistant" || value === "user" || value === "system";
}

function parseMessages(value: unknown): SavedChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => {
      const role: SavedChatMessage["role"] = isSavedChatRole(item.role)
        ? item.role
        : "user";

      return {
        id: toOptionalString(item.id) ?? "",
        role,
        content: toOptionalString(item.content) ?? "",
        parts: Array.isArray(item.parts)
          ? item.parts
              .filter(
                (part): part is { text: string; type: "text" } =>
                  typeof part === "object" &&
                  part !== null &&
                  part.type === "text" &&
                  typeof part.text === "string",
              )
              .map((part) => ({ text: part.text, type: "text" as const }))
          : undefined,
      };
    })
    .filter((message) => message.id && message.content);
}

export async function GET(request: Request) {
  try {
    if (!hasSupabaseRuntimeEnv()) {
      return NextResponse.json(
        { success: false, error: "Shenute history is unavailable right now." },
        { status: 503 },
      );
    }

    const url = new URL(request.url);
    const requestedSessionId = toOptionalUuidString(
      url.searchParams.get("sessionId"),
    );

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in required." },
        { status: 401 },
      );
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (sessionsError) {
      console.error("Failed to fetch Shenute history sessions:", sessionsError);
      return NextResponse.json(
        { success: false, error: "Could not load history." },
        { status: 500 },
      );
    }

    let sessionId: string | null = null;
    if (
      requestedSessionId &&
      sessions?.some((session) => session.id === requestedSessionId)
    ) {
      sessionId = requestedSessionId;
    } else if (sessions && sessions.length > 0) {
      sessionId = sessions[0].id;
    }

    if (!sessionId) {
      return NextResponse.json({
        success: true,
        sessionId: null,
        sessions: sessions ?? [],
        messages: [],
      });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id, role, content, metadata, client_message_id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch Shenute history messages:", messagesError);
      return NextResponse.json(
        { success: false, error: "Could not load history." },
        { status: 500 },
      );
    }

    const sanitizedMessages: SavedChatMessage[] = (messages ?? [])
      .map((message) => message as SavedChatRow)
      .map((message) => ({
        id: message.client_message_id ?? message.id,
        role: message.role,
        content: message.content,
        parts: Array.isArray(message.metadata?.parts)
          ? message.metadata.parts
          : undefined,
      }));

    return NextResponse.json({
      success: true,
      sessionId,
      sessions: sessions ?? [],
      messages: sanitizedMessages ?? [],
    });
  } catch (error) {
    console.error("Shenute history GET failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseRuntimeEnv()) {
      return NextResponse.json(
        { success: false, error: "Shenute history is unavailable right now." },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in required." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as HistoryRequestPayload;
    const sessionId =
      toOptionalUuidString(body.sessionId) ?? crypto.randomUUID();
    const messages = parseMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid messages to save." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { error: sessionError } = await supabase.from("chat_sessions").upsert(
      [
        {
          id: sessionId,
          user_id: user.id,
          title: "Shenute AI conversation",
          metadata: { source: "shenute" },
          updated_at: now,
        },
      ],
      { onConflict: "id" },
    );

    if (sessionError) {
      console.error(
        "Failed to create or update Shenute session:",
        sessionError,
      );
      return NextResponse.json(
        { success: false, error: "Could not save history." },
        { status: 500 },
      );
    }

    const { data: existingMessages, error: fetchError } = await supabase
      .from("chat_messages")
      .select("id, client_message_id")
      .eq("session_id", sessionId);

    if (fetchError) {
      console.error("Failed to fetch existing messages for sync:", fetchError);
    }

    const rows = messages.map((message, index) => {
      const existing = existingMessages?.find(
        (m) => m.client_message_id === message.id,
      );

      // Add a 1ms offset to each message to ensure stable ordering by created_at
      const messageDate = new Date(new Date(now).getTime() + index);

      return {
        id: existing?.id ?? crypto.randomUUID(),
        session_id: sessionId,
        client_message_id: message.id,
        role: message.role,
        content: message.content,
        metadata: {
          parts: message.parts ?? null,
        },
        created_at: messageDate.toISOString(),
      };
    });

    const { error: messagesError } = await supabase
      .from("chat_messages")
      .upsert(rows, { onConflict: "session_id, client_message_id" });

    if (messagesError) {
      console.error("Failed to upsert Shenute messages:", messagesError);
      return NextResponse.json(
        { success: false, error: "Could not save history." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("Shenute history POST failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
