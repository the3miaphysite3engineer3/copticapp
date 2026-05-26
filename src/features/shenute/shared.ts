export type ShenuteProvider =
  | "gemini"
  | "gemini_nmt"
  | "hf"
  | "openrouter"
  | "thoth";

type TextMessagePart = {
  text: string;
  type: "text";
};

export type ChatMessageLike = {
  content?: unknown;
  id: string;
  parts?: unknown;
  role: "assistant" | "system" | "user";
};

export type ShenuteFeedbackSignal = "admin_feedback" | "dislike" | "like";
export type ShenuteReactionSignal = Extract<
  ShenuteFeedbackSignal,
  "dislike" | "like"
>;

type ThinkingStatusCopy = {
  thinkingComposing: string;
  thinkingInitial: string;
  thinkingLong: string;
  thinkingSearching: string;
};

export function isTextMessagePart(part: unknown): part is TextMessagePart {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { text?: unknown; type?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}

export function getMessageText(message: ChatMessageLike) {
  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (!Array.isArray(message.parts)) {
    return "";
  }

  return message.parts
    .filter(isTextMessagePart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function findPreviousUserMessage(
  messages: ChatMessageLike[],
  startIndex: number,
) {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }

    const text = getMessageText(message);
    if (text.length > 0) {
      return message;
    }
  }

  return null;
}

export function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the older selection-based copy path.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export function toShenuteProvider(value: unknown): ShenuteProvider {
  if (value === "gemini") {
    return "gemini";
  }

  if (value === "gemini_nmt") {
    return "gemini_nmt";
  }

  if (value === "hf") {
    return "hf";
  }

  if (value === "openrouter") {
    return "openrouter";
  }

  if (value === "thoth") {
    return "thoth";
  }

  return "thoth";
}

export function getThinkingStatusMessage(
  elapsedSeconds: number,
  copy: ThinkingStatusCopy,
) {
  if (elapsedSeconds >= 30) {
    return copy.thinkingLong;
  }

  if (elapsedSeconds >= 14) {
    return copy.thinkingComposing;
  }

  if (elapsedSeconds >= 5) {
    return copy.thinkingSearching;
  }

  return copy.thinkingInitial;
}
