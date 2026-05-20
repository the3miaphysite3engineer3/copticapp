"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpenCheck,
  Brain,
  Camera,
  Clock3,
  Copy,
  CornerDownRight,
  FlaskConical,
  ImagePlus,
  MessageSquarePlus,
  MoreHorizontal,
  RotateCcw,
  Save,
  SendHorizontal,
  SlidersHorizontal,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { processOCRImage } from "@/actions/ocrActions";
import { AppPageIntro } from "@/components/AppPageIntro";
import {
  AuthGateInlinePrompt,
  AuthGateNotice,
} from "@/components/AuthGateNotice";
import { Badge } from "@/components/Badge";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { useSpeech } from "@/features/dictionary/hooks/useSpeech";
import { cx } from "@/lib/classes";
import { getContributorsPath, getLocalizedHomePath } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";

type ShenuteProvider = "gemini" | "gemini_nmt" | "hf" | "openrouter" | "thoth";

type TextMessagePart = {
  text: string;
  type: "text";
};

type ChatMessageLike = {
  content?: unknown;
  id: string;
  parts?: unknown;
  role: "assistant" | "system" | "user";
};

type SavedChatSession = {
  id: string;
  title: string;
  updated_at: string | null;
};

type ShenuteFeedbackSignal = "admin_feedback" | "dislike" | "like";
type ShenuteReactionSignal = Extract<ShenuteFeedbackSignal, "dislike" | "like">;

type FeedbackStateByMessage = Record<
  string,
  {
    message: string;
    status: "error" | "pending" | "success";
  }
>;

type MessageActionStateByMessage = Record<
  string,
  {
    message: string;
    status: "error" | "success";
  }
>;

const SHENUTE_COPY = {
  en: {
    accessRequired: "Please sign in to access Shenute AI.",
    addImage: "Add Image",
    adminNotePlaceholder:
      "Admin only: add corrected guidance tied to this prompt and response.",
    adminNoteSummary: "Admin learning note",
    aiMode: "Answer style",
    aiModeDescription: "Choose how Shenute should balance depth and speed.",
    answerStyleControls: "Change answer style",
    assistantLabel: "Shenute",
    attachmentHelp:
      "Shenute will read this image with OCR when you send your message.",
    attachmentName: "File",
    attachmentReady: "Image ready for OCR",
    attachmentSize: "Size",
    cameraCapture: "Capture Image",
    cameraClose: "Close Camera",
    cameraFrameFailed: "Could not capture camera frame.",
    cameraImageFailed: "Could not capture image from camera.",
    cameraNotReady: "Camera is not ready.",
    cameraNotSupported: "Camera is not supported on this device/browser.",
    cameraStillLoading: "Camera feed is not ready yet. Try again.",
    cameraSource: "camera",
    cancelResponse: "Stop response",
    chatActions: "Chat actions",
    closeAnswerStyleControls: "Close answer style controls",
    copiedResponse: "Copied.",
    copyResponse: "Copy",
    copyResponseFailed: "Could not copy response.",
    creditsLinkDescription:
      "Credits, technical notes, and research acknowledgements now live on the Contributors page.",
    creditsLinkTitle: "Credits and technical notes",
    creditsShort: "Credits",
    dislike: "Not helpful",
    feedbackPromptMissing:
      "Could not resolve prompt/response for this feedback.",
    feedbackSaved: "Thanks for the feedback.",
    feedbackSavedWithRag: "Thanks, this helps improve Shenute.",
    feedbackSaveFailed: "Could not save feedback.",
    feedbackSaving: "Saving feedback...",
    feedbackSignIn: "Sign in to send feedback.",
    feedbackSignInInline: "Sign in to mark responses helpful.",
    imageAttached: "Image attached",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Ask about Coptic vocabulary, grammar, translation, and manuscript context without leaving the shared app workspace.",
    jumpToLatest: "Latest",
    like: "Helpful",
    noTextExtracted: "No text extracted from the selected image.",
    ocrFailed: "OCR failed for the selected image.",
    placeholder: "Ask about a Coptic word, grammar rule, or attached image...",
    saveHistory: "Save now",
    saveHistorySaved: "Saved",
    savingHistory: "Saving...",
    savedHistory: "Conversation saved.",
    saveHistoryFailed: "Could not save this conversation.",
    autosaveHint: "Conversations save automatically to your account.",
    autosaveStatus: "Saved to your account.",
    unsavedChanges: "Unsaved changes. Saving automatically...",
    historySessions: "Saved sessions",
    clearConversation: "Delete conversation",
    clearConversationConfirm:
      "Delete this Shenute conversation? Saved copies will be removed from your account.",
    clearConversationFailed: "Could not delete this conversation.",
    clearingConversation: "Deleting conversation...",
    conversationCleared: "Conversation deleted.",
    continuePrompt: "Please continue your previous response.",
    continueResponse: "Continue answer",
    newConversation: "Start new chat",
    newConversationStarted: "New chat started.",
    thinking: "Thinking",
    loadSession: "Load",
    currentSession: "Current",
    loadingSession: "Loading session...",
    sessionCount: "sessions",
    sessionDateMissing: "No timestamp",
    sessionUnsavedBadge: "Unsaved",
    providerGemini: "Fast answer",
    providerGeminiDescription:
      "Use Gemini's own pretrained knowledge with retrieval as optional support.",
    providerGeminiNmt: "Fast answer (RAG + NMT)",
    providerGeminiNmtDescription:
      "Gemini with strict retrieved-context grounding plus NMT translation hints.",
    providerHf: "Experimental",
    providerHfDescription: "A lighter experimental pass for comparison.",
    providerOpenRouter: "Reasoned answer",
    providerOpenRouterDescription:
      "More step-by-step structure for harder questions.",
    providerThoth: "Best answer",
    providerThothDescription: "The strongest default for Coptology questions.",
    ragWarning: "Saved, but the learning sync warned:",
    rateLimit: "Rate limit reached. Please try again later.",
    regenerateResponse: "Regenerate",
    remove: "Remove",
    requestFailed: "AI request failed.",
    runningOcr: "Running OCR...",
    sendMessage: "Send message",
    selectedImageAlt: "Selected for OCR",
    submitAdminNote: "Send admin note",
    starterPromptsTitle: "Try asking Shenute",
    starterPromptGrammar: "Explain how the Bohairic definite article works.",
    starterPromptImage: "Help me read a Coptic manuscript image.",
    starterPromptTranslate:
      "Translate “Jesus Christ is risen” into Bohairic Coptic.",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Use Camera",
    userLabel: "You",
    viewNmtCredits: "View NMT credits",
    viewShenuteCredits: "View Shenute credits",
    welcomeDescription:
      "Start with a word, a grammar question, or an image attachment and Shenute AI will keep the conversation grounded in your Coptology work.",
    welcomeTitle: "Welcome to Shenute AI",
    writeAdminFeedback: "Write admin feedback before sending.",
    play: "Speak",
    stop: "Stop",
  },
  nl: {
    accessRequired: "Meld u aan om Shenute AI te gebruiken.",
    addImage: "Afbeelding toevoegen",
    adminNotePlaceholder:
      "Alleen voor beheerders: voeg gecorrigeerde uitleg toe bij deze prompt en dit antwoord.",
    adminNoteSummary: "Leer-notitie voor beheerder",
    aiMode: "Antwoordstijl",
    aiModeDescription: "Kies hoe Shenute diepgang en snelheid moet afwegen.",
    answerStyleControls: "Antwoordstijl wijzigen",
    assistantLabel: "Shenute",
    attachmentHelp:
      "Shenute leest deze afbeelding met OCR wanneer u uw bericht verzendt.",
    attachmentName: "Bestand",
    attachmentReady: "Afbeelding klaar voor OCR",
    attachmentSize: "Grootte",
    cameraCapture: "Afbeelding vastleggen",
    cameraClose: "Camera sluiten",
    cameraFrameFailed: "Het camerabeeld kon niet worden vastgelegd.",
    cameraImageFailed:
      "De afbeelding kon niet vanuit de camera worden vastgelegd.",
    cameraNotReady: "De camera is nog niet klaar.",
    cameraNotSupported:
      "De camera wordt niet ondersteund op dit apparaat of in deze browser.",
    cameraStillLoading: "De camerafeed is nog niet klaar. Probeer het opnieuw.",
    cameraSource: "camera",
    cancelResponse: "Antwoord stoppen",
    chatActions: "Chatopties",
    closeAnswerStyleControls: "Antwoordstijl sluiten",
    copiedResponse: "Gekopieerd.",
    copyResponse: "Kopiëren",
    copyResponseFailed: "Kopiëren is mislukt.",
    creditsLinkDescription:
      "Credits, technische notities en onderzoeksvermeldingen staan nu op de bijdragerspagina.",
    creditsLinkTitle: "Credits en technische notities",
    creditsShort: "Credits",
    dislike: "Niet behulpzaam",
    feedbackPromptMissing:
      "De prompt en het antwoord voor deze feedback konden niet worden bepaald.",
    feedbackSaved: "Bedankt voor uw feedback.",
    feedbackSavedWithRag: "Bedankt, dit helpt Shenute te verbeteren.",
    feedbackSaveFailed: "Feedback kon niet worden opgeslagen.",
    feedbackSaving: "Feedback opslaan...",
    feedbackSignIn: "Meld u aan om feedback te verzenden.",
    feedbackSignInInline: "Meld u aan om antwoorden als behulpzaam te markeren",
    imageAttached: "Afbeelding toegevoegd",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Stel vragen over Koptische woordenschat, grammatica, vertaling en manuscriptcontext zonder de gedeelde werkruimte te verlaten.",
    jumpToLatest: "Nieuwste",
    like: "Behulpzaam",
    noTextExtracted:
      "Er is geen tekst uit de geselecteerde afbeelding gehaald.",
    ocrFailed: "OCR is mislukt voor de geselecteerde afbeelding.",
    placeholder:
      "Vraag naar een Koptisch woord, een grammaticaregel of een toegevoegde afbeelding...",
    saveHistory: "Nu opslaan",
    saveHistorySaved: "Opgeslagen",
    savingHistory: "Opslaan...",
    savedHistory: "Gesprek opgeslagen.",
    saveHistoryFailed: "Dit gesprek kon niet worden opgeslagen.",
    autosaveHint: "Gesprekken worden automatisch in uw account opgeslagen.",
    autosaveStatus: "Opgeslagen in uw account.",
    unsavedChanges: "Niet-opgeslagen wijzigingen. Automatisch opslaan...",
    historySessions: "Opgeslagen sessies",
    clearConversation: "Gesprek verwijderen",
    clearConversationConfirm:
      "Dit Shenute-gesprek verwijderen? Opgeslagen kopieën worden uit uw account verwijderd.",
    clearConversationFailed: "Dit gesprek kon niet worden verwijderd.",
    clearingConversation: "Gesprek verwijderen...",
    conversationCleared: "Gesprek verwijderd.",
    continuePrompt: "Ga verder met uw vorige antwoord.",
    continueResponse: "Antwoord vervolgen",
    newConversation: "Nieuwe chat starten",
    newConversationStarted: "Nieuwe chat gestart.",
    thinking: "Denkt na",
    loadSession: "Laden",
    currentSession: "Huidig",
    loadingSession: "Sessieweergave laden...",
    sessionCount: "sessies",
    sessionDateMissing: "Geen tijdstempel",
    sessionUnsavedBadge: "Niet opgeslagen",
    providerGemini: "Snel antwoord",
    providerGeminiDescription:
      "Gebruik Gemini's eigen voorkennis met opgehaalde context als optionele steun.",
    providerGeminiNmt: "Snel antwoord (RAG + NMT)",
    providerGeminiNmtDescription:
      "Gemini met strikte contextverankering en NMT-vertaalsuggesties.",
    providerHf: "Experimenteel",
    providerHfDescription: "Een lichtere experimentele vergelijking.",
    providerOpenRouter: "Uitgewerkt antwoord",
    providerOpenRouterDescription:
      "Meer stapsgewijze structuur voor moeilijkere vragen.",
    providerThoth: "Beste antwoord",
    providerThothDescription:
      "De sterkste standaard voor Koptologische vragen.",
    ragWarning: "Opgeslagen, maar de leersynchronisatie waarschuwde:",
    rateLimit: "De limiet is bereikt. Probeer het later opnieuw.",
    regenerateResponse: "Opnieuw genereren",
    remove: "Verwijderen",
    requestFailed: "AI-verzoek mislukt.",
    runningOcr: "OCR uitvoeren...",
    sendMessage: "Bericht verzenden",
    selectedImageAlt: "Geselecteerd voor OCR",
    submitAdminNote: "Beheerdersnotitie sturen",
    starterPromptsTitle: "Probeer Shenute",
    starterPromptGrammar: "Leg uit hoe het Bohairische bepaald lidwoord werkt.",
    starterPromptImage: "Help me een Koptische manuscriptfoto te lezen.",
    starterPromptTranslate:
      "Vertaal “Jezus Christus is opgestaan” naar Bohairisch-Koptisch.",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Camera gebruiken",
    userLabel: "U",
    viewNmtCredits: "Bekijk NMT-credits",
    viewShenuteCredits: "Bekijk Shenute-credits",
    welcomeDescription:
      "Begin met een woord, een grammaticavraag of een afbeelding. Shenute AI houdt het gesprek verbonden met uw Koptologiewerk.",
    welcomeTitle: "Welkom bij Shenute AI",
    writeAdminFeedback: "Schrijf beheerdersfeedback voordat u die verstuurt.",
    play: "Spreken",
    stop: "Stop",
  },
} as const;

type ShenuteCopy = (typeof SHENUTE_COPY)[keyof typeof SHENUTE_COPY];
type ShenuteLanguage = keyof typeof SHENUTE_COPY;

const MESSAGE_ACTION_BUTTON_CLASS = "h-8 shrink-0 gap-1.5 px-2 text-xs";

function isTextMessagePart(part: unknown): part is TextMessagePart {
  if (!part || typeof part !== "object") {
    return false;
  }

  const candidate = part as { text?: unknown; type?: unknown };
  return candidate.type === "text" && typeof candidate.text === "string";
}

function getMessageText(message: ChatMessageLike) {
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

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number, language: ShenuteLanguage) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const isMegabyte = bytes >= 1024 * 1024;
  const value = isMegabyte ? bytes / (1024 * 1024) : bytes / 1024;
  const formattedValue = new Intl.NumberFormat(
    language === "nl" ? "nl-NL" : "en-US",
    {
      maximumFractionDigits: value >= 10 ? 0 : 1,
    },
  ).format(value);

  return `${formattedValue} ${isMegabyte ? "MB" : "KB"}`;
}

function formatSessionTimestamp(
  updatedAt: string | null,
  language: ShenuteLanguage,
  fallback: string,
) {
  if (!updatedAt) {
    return fallback;
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeChatMessages<T extends ChatMessageLike>(
  messages: readonly T[],
) {
  const messageIndexesById = new Map<string, number>();
  const normalizedMessages: T[] = [];

  messages.forEach((message, index) => {
    const id = message.id.trim();
    const normalizedMessage =
      id.length > 0 ? message : ({ ...message, id: `message-${index}` } as T);
    const normalizedId = normalizedMessage.id;
    const existingIndex = messageIndexesById.get(normalizedId);

    if (typeof existingIndex === "number") {
      normalizedMessages[existingIndex] = normalizedMessage;
      return;
    }

    messageIndexesById.set(normalizedId, normalizedMessages.length);
    normalizedMessages.push(normalizedMessage);
  });

  return normalizedMessages;
}

function getChatMessagesSignature(messages: readonly ChatMessageLike[]) {
  return JSON.stringify(messages.map(serializeChatMessage));
}

type SavedChatMessage = {
  id: string;
  role: ChatMessageLike["role"];
  content: string;
  parts?: Array<{ text: string; type: "text" }>;
};

function serializeChatMessage(message: ChatMessageLike): SavedChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: getMessageText(message),
    parts: Array.isArray(message.parts)
      ? message.parts
          .filter(isTextMessagePart)
          .map((part) => ({ text: part.text, type: "text" }))
      : undefined,
  };
}

async function saveChatHistoryOnline(
  messages: ChatMessageLike[],
  sessionId: string,
): Promise<{
  success: boolean;
  sessionId?: string;
  sessions?: Array<SavedChatSession>;
}> {
  if (typeof window === "undefined") {
    return { success: false };
  }

  try {
    const response = await fetch("/api/shenute/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        messages: messages.map(serializeChatMessage),
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = (await response.json()) as {
      success: boolean;
      sessionId?: string;
      sessions?: Array<SavedChatSession>;
    };

    return data;
  } catch {
    return { success: false };
  }
}

function findPreviousUserMessage(
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

function getErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as { cause?: unknown; status?: unknown };
  if (typeof candidate.status === "number") {
    return candidate.status;
  }

  if (candidate.cause && typeof candidate.cause === "object") {
    const cause = candidate.cause as { status?: unknown };
    if (typeof cause.status === "number") {
      return cause.status;
    }
  }

  return undefined;
}

function getShenuteErrorMessage(error: unknown, copy: ShenuteCopy) {
  const status = getErrorStatusCode(error);
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  if (
    status === 429 ||
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("rate limit")
  ) {
    return copy.rateLimit;
  }

  if (
    status === 401 ||
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("sign in")
  ) {
    return copy.accessRequired;
  }

  return message || copy.requestFailed;
}

function getFeedbackStatusClass(status: "error" | "pending" | "success") {
  if (status === "error") {
    return "text-rose-700 dark:text-rose-300";
  }

  if (status === "pending") {
    return "text-muted";
  }

  return "text-coptic";
}

function getMessageAvatarClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "bg-accent-strong text-paper ring-2 ring-accent/20 dark:bg-accent-soft dark:text-ink dark:ring-accent/30";
  }

  return "bg-coptic-soft text-coptic ring-2 ring-coptic/20";
}

function getMessageBubbleClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "rounded-br-md bg-accent-strong text-paper shadow-sm dark:bg-accent-soft dark:text-ink";
  }

  return "rounded-bl-md border border-line bg-surface/95 text-ink shadow-soft ring-1 ring-line/60";
}

function getReactionButtonClassName(
  active: boolean,
  tone: "negative" | "positive",
) {
  if (active && tone === "positive") {
    return "border-coptic/60 bg-coptic-soft text-coptic";
  }

  if (active && tone === "negative") {
    return "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  }

  return "border-line text-muted hover:bg-elevated hover:text-ink";
}

function getProviderLabel(provider: ShenuteProvider, copy: ShenuteCopy) {
  if (provider === "gemini") {
    return copy.providerGemini;
  }

  if (provider === "gemini_nmt") {
    return copy.providerGeminiNmt;
  }

  if (provider === "hf") {
    return copy.providerHf;
  }

  if (provider === "openrouter") {
    return copy.providerOpenRouter;
  }

  return copy.providerThoth;
}

export default function ShenuteAI() {
  const { language, t } = useLanguage();
  const copy = SHENUTE_COPY[language];
  const [inferenceProvider, setInferenceProvider] =
    useState<ShenuteProvider>("thoth");
  const [inputValue, setInputValue] = useState("");
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [shenuteAccessError, setShenuteAccessError] = useState<string | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<
    string | null
  >(null);
  const [selectedImageSource, setSelectedImageSource] = useState<
    "upload" | "camera" | null
  >(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnswerStylePanelOpen, setIsAnswerStylePanelOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shenuteSessionIdRef = useRef(crypto.randomUUID());

  const { isAuthenticated, isReady, user } = useOptionalAuthGate();
  const [selectedReactionByMessage, setSelectedReactionByMessage] = useState<
    Record<string, ShenuteReactionSignal>
  >({});
  const [adminFeedbackDraftByMessage, setAdminFeedbackDraftByMessage] =
    useState<Record<string, string>>({});
  const [feedbackStateByMessage, setFeedbackStateByMessage] =
    useState<FeedbackStateByMessage>({});
  const [messageActionStateByMessage, setMessageActionStateByMessage] =
    useState<MessageActionStateByMessage>({});
  const [canSubmitAdminFeedback, setCanSubmitAdminFeedback] = useState(false);
  const isSavingRef = useRef(false);
  const lastSavedMessageSignatureRef = useRef(getChatMessagesSignature([]));

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/shenute",
      }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop: stopChatResponse,
    status,
    error,
  } = useChat({
    transport,
  });

  const {
    speakMixed,
    stop: stopSpeech,
    isSpeaking,
    isPremiumLoading,
  } = useSpeech();

  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);
  const [isHistorySaving, setIsHistorySaving] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionLoadingId, setSessionLoadingId] = useState<string | null>(null);
  const [hasRestoredHistory, setHasRestoredHistory] = useState(false);
  const [historyActionStatus, setHistoryActionStatus] = useState<string | null>(
    null,
  );
  const [thinkingElapsedSeconds, setThinkingElapsedSeconds] = useState(0);
  const [isTranscriptAtBottom, setIsTranscriptAtBottom] = useState(true);
  const isLoading = status !== "ready";
  const isShenuteAccessBlocked = isReady && !isAuthenticated;
  const typedMessages = useMemo(
    () => normalizeChatMessages(messages as ChatMessageLike[]),
    [messages],
  );
  const currentMessageSignature = useMemo(
    () => getChatMessagesSignature(typedMessages),
    [typedMessages],
  );
  const hasUnsavedConversationChanges =
    typedMessages.length > 0 &&
    currentMessageSignature !== lastSavedMessageSignatureRef.current;
  const hasConversationDraft =
    inputValue.trim().length > 0 || Boolean(selectedImage);
  const selectedImageSizeLabel = selectedImage
    ? formatFileSize(selectedImage.size, language)
    : null;
  const isAttachmentMenuDisabled =
    isLoading || ocrPending || isShenuteAccessBlocked;
  const canStartNewConversation =
    Boolean(activeSessionId) ||
    typedMessages.length > 0 ||
    hasConversationDraft;
  const starterPrompts = useMemo(
    () => [
      {
        icon: Sparkles,
        prompt: copy.starterPromptTranslate,
      },
      {
        icon: BookOpenCheck,
        prompt: copy.starterPromptGrammar,
      },
      {
        icon: ImagePlus,
        prompt: copy.starterPromptImage,
      },
    ],
    [
      copy.starterPromptGrammar,
      copy.starterPromptImage,
      copy.starterPromptTranslate,
    ],
  );
  const providerOptions = useMemo(
    () => [
      {
        description: copy.providerThothDescription,
        icon: Sparkles,
        label: copy.providerThoth,
        value: "thoth" as const,
      },
      {
        description: copy.providerGeminiDescription,
        icon: Zap,
        label: copy.providerGemini,
        value: "gemini" as const,
      },
      {
        description: copy.providerGeminiNmtDescription,
        icon: Zap,
        label: copy.providerGeminiNmt,
        value: "gemini_nmt" as const,
      },
      {
        description: copy.providerOpenRouterDescription,
        icon: Brain,
        label: copy.providerOpenRouter,
        value: "openrouter" as const,
      },
      {
        description: copy.providerHfDescription,
        icon: FlaskConical,
        label: copy.providerHf,
        value: "hf" as const,
      },
    ],
    [
      copy.providerGemini,
      copy.providerGeminiDescription,
      copy.providerGeminiNmt,
      copy.providerGeminiNmtDescription,
      copy.providerHf,
      copy.providerHfDescription,
      copy.providerOpenRouter,
      copy.providerOpenRouterDescription,
      copy.providerThoth,
      copy.providerThothDescription,
    ],
  );
  const selectedProviderOption =
    providerOptions.find((option) => option.value === inferenceProvider) ??
    providerOptions[0]!;
  const sessionCountLabel = `${sessions.length} ${copy.sessionCount}`;
  let saveButtonLabel: string = copy.saveHistorySaved;
  if (isHistorySaving) {
    saveButtonLabel = copy.savingHistory;
  } else if (hasUnsavedConversationChanges || typedMessages.length === 0) {
    saveButtonLabel = copy.saveHistory;
  }

  let historyStatusMessage: string = autosaveStatus ?? copy.autosaveStatus;
  if (historyActionStatus) {
    historyStatusMessage = historyActionStatus;
  } else if (typedMessages.length === 0) {
    historyStatusMessage = copy.autosaveHint;
  } else if (isHistorySaving) {
    historyStatusMessage = copy.savingHistory;
  } else if (hasUnsavedConversationChanges) {
    historyStatusMessage = copy.unsavedChanges;
  }
  let historyStatusDotClassName = "bg-muted/40";
  if (isHistorySaving || hasUnsavedConversationChanges) {
    historyStatusDotClassName = "bg-warning";
  } else if (typedMessages.length > 0) {
    historyStatusDotClassName = "bg-coptic";
  }

  const updateTranscriptScrollState = useCallback(() => {
    const transcript = transcriptScrollRef.current;
    if (!transcript) {
      setIsTranscriptAtBottom(true);
      return;
    }

    const distanceFromBottom =
      transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    const nextIsAtBottom = distanceFromBottom < 96;
    setIsTranscriptAtBottom((current) =>
      current === nextIsAtBottom ? current : nextIsAtBottom,
    );
  }, []);

  const scrollTranscriptToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const transcript = transcriptScrollRef.current;
      if (transcript) {
        transcript.scrollTo({
          top: transcript.scrollHeight,
          behavior,
        });
      } else {
        messagesEndRef.current?.scrollIntoView({
          block: "end",
          behavior,
        });
      }

      setIsTranscriptAtBottom(true);
    },
    [],
  );

  useEffect(() => {
    if (typedMessages.length === messages.length) {
      return;
    }

    setMessages(typedMessages as UIMessage[]);
  }, [messages.length, setMessages, typedMessages]);

  useEffect(() => {
    if (!isLoading) {
      setThinkingElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setThinkingElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setThinkingElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isAnswerStylePanelOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAnswerStylePanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswerStylePanelOpen]);

  useEffect(() => {
    if (isShenuteAccessBlocked) {
      setIsAnswerStylePanelOpen(false);
    }
  }, [isShenuteAccessBlocked]);

  useEffect(() => {
    const textarea = messageInputRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [inputValue]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCanSubmitAdminFeedback(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setCanSubmitAdminFeedback(false);
      return;
    }

    let isMounted = true;
    const loadAdminFeedbackAccess = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        setCanSubmitAdminFeedback(data?.role === "admin");
      } catch {
        if (isMounted) {
          setCanSubmitAdminFeedback(false);
        }
      }
    };

    void loadAdminFeedbackAccess();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (typedMessages.length === 0) {
      setIsTranscriptAtBottom(true);
      return;
    }

    if (!isTranscriptAtBottom) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollTranscriptToBottom("smooth");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    isLoading,
    isTranscriptAtBottom,
    scrollTranscriptToBottom,
    typedMessages.length,
  ]);

  useEffect(() => {
    if (hasRestoredHistory || !isReady || !isAuthenticated) {
      return;
    }

    const restoreHistory = async () => {
      try {
        const response = await fetch("/api/shenute/history");
        if (!response.ok) {
          setHasRestoredHistory(true);
          return;
        }

        const payload = (await response.json()) as {
          success: boolean;
          sessionId?: string;
          sessions?: Array<SavedChatSession>;
          messages?: Array<ChatMessageLike>;
        };

        if (payload.success) {
          if (Array.isArray(payload.sessions)) {
            setSessions(payload.sessions);
          }

          if (payload.sessionId) {
            shenuteSessionIdRef.current = payload.sessionId;
            setActiveSessionId(payload.sessionId);
          }

          if (Array.isArray(payload.messages)) {
            const restoredMessages = normalizeChatMessages(payload.messages);
            lastSavedMessageSignatureRef.current =
              getChatMessagesSignature(restoredMessages);
            setMessages(restoredMessages as UIMessage[]);
            setIsTranscriptAtBottom(true);
            window.requestAnimationFrame(() => {
              scrollTranscriptToBottom("auto");
            });
          } else {
            lastSavedMessageSignatureRef.current = getChatMessagesSignature([]);
          }
        }
      } catch {
        // ignore restore failures
      } finally {
        setHasRestoredHistory(true);
      }
    };

    void restoreHistory();
  }, [
    hasRestoredHistory,
    isAuthenticated,
    isReady,
    scrollTranscriptToBottom,
    setMessages,
  ]);

  useEffect(() => {
    if (
      typedMessages.length === 0 ||
      !isReady ||
      !isAuthenticated ||
      !hasRestoredHistory ||
      isLoading ||
      !hasUnsavedConversationChanges
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isSavingRef.current) {
        return;
      }

      const messagesToSave = typedMessages;
      const savedSignature = currentMessageSignature;
      isSavingRef.current = true;
      setIsHistorySaving(true);
      void saveChatHistoryOnline(
        messagesToSave,
        shenuteSessionIdRef.current,
      ).then((result) => {
        isSavingRef.current = false;
        setIsHistorySaving(false);
        if (result.success) {
          if (result.sessionId) {
            shenuteSessionIdRef.current = result.sessionId;
            setActiveSessionId(result.sessionId);
          }
          if (Array.isArray(result.sessions)) {
            setSessions(result.sessions);
          }
          lastSavedMessageSignatureRef.current = savedSignature;
          setAutosaveStatus(copy.autosaveStatus);
        }
      });
    }, 1000);

    const clearTimer = () => window.clearTimeout(timer);
    return clearTimer;
  }, [
    typedMessages,
    currentMessageSignature,
    copy.autosaveStatus,
    hasUnsavedConversationChanges,
    hasRestoredHistory,
    isLoading,
    isReady,
    isAuthenticated,
  ]);

  function handleSaveHistory() {
    if (isHistorySaving || !hasUnsavedConversationChanges) {
      return;
    }

    const messagesToSave = typedMessages;
    const savedSignature = currentMessageSignature;
    setIsHistorySaving(true);
    isSavingRef.current = true;

    void saveChatHistoryOnline(
      messagesToSave,
      shenuteSessionIdRef.current,
    ).then((result) => {
      isSavingRef.current = false;
      setIsHistorySaving(false);
      if (!result.success) {
        setTemporaryHistoryActionStatus(copy.saveHistoryFailed);
        return;
      }

      if (result.sessionId) {
        shenuteSessionIdRef.current = result.sessionId;
        setActiveSessionId(result.sessionId);
      }
      if (Array.isArray(result.sessions)) {
        setSessions(result.sessions);
      }
      lastSavedMessageSignatureRef.current = savedSignature;
      setAutosaveStatus(copy.autosaveStatus);
      setTemporaryHistoryActionStatus(copy.savedHistory);
    });
  }

  async function loadShenuteSession(sessionId: string) {
    if (!sessionId || sessionId === activeSessionId) {
      return { success: false };
    }

    setSessionLoadingId(sessionId);
    setSessionStatus(copy.loadingSession);

    try {
      const response = await fetch(
        `/api/shenute/history?sessionId=${encodeURIComponent(sessionId)}`,
      );

      if (!response.ok) {
        return { success: false };
      }

      const payload = (await response.json()) as {
        success: boolean;
        sessionId?: string;
        sessions?: Array<SavedChatSession>;
        messages?: Array<ChatMessageLike>;
      };

      if (!payload.success || !payload.sessionId) {
        return { success: false };
      }

      setSessions(
        Array.isArray(payload.sessions) ? payload.sessions : sessions,
      );
      const loadedMessages = Array.isArray(payload.messages)
        ? normalizeChatMessages(payload.messages)
        : [];
      lastSavedMessageSignatureRef.current =
        getChatMessagesSignature(loadedMessages);
      setMessages(loadedMessages as UIMessage[]);
      setActiveSessionId(payload.sessionId);
      shenuteSessionIdRef.current = payload.sessionId;
      setIsTranscriptAtBottom(true);
      window.requestAnimationFrame(() => {
        scrollTranscriptToBottom("auto");
      });

      return { success: true, sessionId: payload.sessionId };
    } catch {
      return { success: false };
    } finally {
      setSessionLoadingId(null);
      setSessionStatus(null);
    }
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setSelectedImageSource(null);
    setOcrError(null);
    setCameraError(null);

    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function setTemporaryHistoryActionStatus(message: string) {
    setHistoryActionStatus(message);
    window.setTimeout(() => {
      setHistoryActionStatus((current) =>
        current === message ? null : current,
      );
    }, 3000);
  }

  function resetConversationWorkspace() {
    stopSpeech();
    stopCamera();
    clearSelectedImage();
    setInputValue("");
    setOcrError(null);
    setCameraError(null);
    setShenuteAccessError(null);
    setSelectedReactionByMessage({});
    setAdminFeedbackDraftByMessage({});
    setFeedbackStateByMessage({});
    setMessageActionStateByMessage({});
    setAutosaveStatus(null);
    setSessionStatus(null);
    setSessionLoadingId(null);
    setIsTranscriptAtBottom(true);
  }

  async function startNewConversation() {
    if (isLoading || isHistorySaving || !canStartNewConversation) {
      return;
    }

    if (
      typedMessages.length > 0 &&
      isAuthenticated &&
      hasUnsavedConversationChanges
    ) {
      setIsHistorySaving(true);
      isSavingRef.current = true;
      const result = await saveChatHistoryOnline(
        typedMessages,
        shenuteSessionIdRef.current,
      );
      isSavingRef.current = false;
      setIsHistorySaving(false);

      if (!result.success) {
        setTemporaryHistoryActionStatus(copy.saveHistoryFailed);
        return;
      }

      if (Array.isArray(result.sessions)) {
        setSessions(result.sessions);
      }
    }

    resetConversationWorkspace();
    setMessages([]);
    lastSavedMessageSignatureRef.current = getChatMessagesSignature([]);
    setActiveSessionId(null);
    shenuteSessionIdRef.current = crypto.randomUUID();
    setTemporaryHistoryActionStatus(copy.newConversationStarted);
  }

  async function clearCurrentConversation() {
    if (isLoading) {
      return;
    }

    if (!activeSessionId && typedMessages.length === 0) {
      await startNewConversation();
      return;
    }

    if (!window.confirm(copy.clearConversationConfirm)) {
      return;
    }

    const sessionIdToClear = activeSessionId;
    setSessionStatus(copy.clearingConversation);

    try {
      if (sessionIdToClear && isAuthenticated) {
        const response = await fetch(
          `/api/shenute/history?sessionId=${encodeURIComponent(
            sessionIdToClear,
          )}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error(copy.clearConversationFailed);
        }
      }

      resetConversationWorkspace();
      setMessages([]);
      lastSavedMessageSignatureRef.current = getChatMessagesSignature([]);
      setActiveSessionId(null);
      if (sessionIdToClear) {
        setSessions((current) =>
          current.filter((session) => session.id !== sessionIdToClear),
        );
      }
      shenuteSessionIdRef.current = crypto.randomUUID();
      setTemporaryHistoryActionStatus(copy.conversationCleared);
    } catch {
      setSessionStatus(null);
      setTemporaryHistoryActionStatus(copy.clearConversationFailed);
    }
  }

  function setImageAttachment(file: File, source: "upload" | "camera") {
    setSelectedImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return URL.createObjectURL(file);
    });

    setSelectedImage(file);
    setSelectedImageSource(source);
    setOcrError(null);
  }

  function stopCamera() {
    const stream = cameraStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  async function openCamera() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCameraError(copy.cameraNotSupported);
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (cameraOpenError) {
      setCameraError(
        cameraOpenError instanceof Error
          ? cameraOpenError.message
          : copy.cameraNotSupported,
      );
    }
  }

  async function captureFromCamera() {
    const videoElement = videoRef.current;
    const canvasElement = captureCanvasRef.current;

    if (!videoElement || !canvasElement) {
      setCameraError(copy.cameraNotReady);
      return;
    }

    const width = videoElement.videoWidth || 1280;
    const height = videoElement.videoHeight || 720;

    if (width <= 0 || height <= 0) {
      setCameraError(copy.cameraStillLoading);
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;
    const context = canvasElement.getContext("2d");
    if (!context) {
      setCameraError(copy.cameraFrameFailed);
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError(copy.cameraImageFailed);
      return;
    }

    const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
    const capturedFile = new File([blob], `camera-${timestamp}.jpg`, {
      type: "image/jpeg",
    });

    setImageAttachment(capturedFile, "camera");
    stopCamera();
  }

  useEffect(() => {
    const stream = cameraStreamRef.current;
    if (!cameraOpen || !stream || !videoRef.current) {
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      // Ignore autoplay rejections; user can still capture after manual interaction.
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
      setSelectedImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return null;
      });
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isShenuteAccessBlocked) {
      setShenuteAccessError(copy.accessRequired);
      return;
    }

    setShenuteAccessError(null);

    if ((!inputValue.trim() && !selectedImage) || isLoading || ocrPending) {
      return;
    }

    let composedPrompt = inputValue.trim();

    if (selectedImage) {
      setOcrPending(true);
      setOcrError(null);

      try {
        const ocrFormData = new FormData();
        ocrFormData.append("file", selectedImage);
        const ocrText = await processOCRImage(ocrFormData);
        const trimmedOcrText = ocrText
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);

        composedPrompt = [
          composedPrompt,
          copy.imageOcrContext,
          `Image: ${selectedImage.name}`,
          trimmedOcrText,
        ]
          .filter((part) => part.length > 0)
          .join("\n\n");
      } catch (ocrProcessingError) {
        setOcrError(
          ocrProcessingError instanceof Error
            ? ocrProcessingError.message
            : copy.ocrFailed,
        );
        setOcrPending(false);
        return;
      } finally {
        setOcrPending(false);
      }
    }

    if (!composedPrompt.trim()) {
      setOcrError(copy.noTextExtracted);
      return;
    }

    setIsTranscriptAtBottom(true);
    sendMessage(
      { text: composedPrompt },
      {
        body: {
          inferenceProvider,
        },
      },
    );
    setInputValue("");
    clearSelectedImage();
    window.requestAnimationFrame(() => {
      scrollTranscriptToBottom("smooth");
    });
  };

  function handlePromptKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function setTemporaryMessageActionState(
    messageId: string,
    message: string,
    status: "error" | "success",
  ) {
    setMessageActionStateByMessage((current) => ({
      ...current,
      [messageId]: { message, status },
    }));
    window.setTimeout(() => {
      setMessageActionStateByMessage((current) => {
        if (current[messageId]?.message !== message) {
          return current;
        }

        const next = { ...current };
        delete next[messageId];
        return next;
      });
    }, 2500);
  }

  async function handleCopyMessage(message: ChatMessageLike) {
    const text = getMessageText(message);
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setTemporaryMessageActionState(
        message.id,
        copy.copiedResponse,
        "success",
      );
    } catch {
      setTemporaryMessageActionState(
        message.id,
        copy.copyResponseFailed,
        "error",
      );
    }
  }

  function handleRegenerateMessage(message: ChatMessageLike) {
    if (isLoading || message.role !== "assistant") {
      return;
    }

    setIsTranscriptAtBottom(true);
    void regenerate({
      messageId: message.id,
      body: {
        inferenceProvider,
      },
    });
    window.requestAnimationFrame(() => {
      scrollTranscriptToBottom("smooth");
    });
  }

  function handleContinueConversation() {
    if (isLoading || isShenuteAccessBlocked) {
      return;
    }

    setIsTranscriptAtBottom(true);
    sendMessage(
      { text: copy.continuePrompt },
      {
        body: {
          inferenceProvider,
        },
      },
    );
    window.requestAnimationFrame(() => {
      scrollTranscriptToBottom("smooth");
    });
  }

  function handleStarterPrompt(prompt: string) {
    setInputValue(prompt);
    if (shenuteAccessError) {
      setShenuteAccessError(null);
    }
    window.requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  }

  function scrollToLatestMessage() {
    scrollTranscriptToBottom("smooth");
    messageInputRef.current?.focus({ preventScroll: true });
  }

  async function submitFeedbackSignal(options: {
    assistantMessage: ChatMessageLike;
    feedbackText?: string;
    promptMessage: ChatMessageLike | null;
    signal: ShenuteFeedbackSignal;
  }) {
    if (!isAuthenticated) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: copy.feedbackSignIn,
          status: "error",
        },
      }));
      return false;
    }

    const assistantResponse = getMessageText(options.assistantMessage);
    const prompt = options.promptMessage
      ? getMessageText(options.promptMessage)
      : "";

    if (!assistantResponse || !prompt) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: copy.feedbackPromptMissing,
          status: "error",
        },
      }));
      return false;
    }

    setFeedbackStateByMessage((current) => ({
      ...current,
      [options.assistantMessage.id]: {
        message: copy.feedbackSaving,
        status: "pending",
      },
    }));

    try {
      const response = await fetch("/api/shenute/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantMessageId: options.assistantMessage.id,
          assistantResponse,
          shenuteSessionId: shenuteSessionIdRef.current,
          feedbackText: options.feedbackText,
          inferenceProvider,
          prompt,
          signal: options.signal,
          userMessageId: options.promptMessage?.id,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        ragIngested?: boolean;
        ragWarning?: string;
        success?: boolean;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? copy.feedbackSaveFailed);
      }

      let successMessage: string = copy.feedbackSaved;
      if (payload.ragIngested) {
        successMessage = copy.feedbackSavedWithRag;
      } else if (payload.ragWarning) {
        successMessage = `${copy.ragWarning} ${payload.ragWarning}`;
      }

      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message: successMessage,
          status: "success",
        },
      }));

      return true;
    } catch (feedbackError) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [options.assistantMessage.id]: {
          message:
            feedbackError instanceof Error
              ? feedbackError.message
              : copy.feedbackSaveFailed,
          status: "error",
        },
      }));
      return false;
    }
  }

  async function handleReaction(
    signal: ShenuteReactionSignal,
    assistantMessage: ChatMessageLike,
    promptMessage: ChatMessageLike | null,
  ) {
    const success = await submitFeedbackSignal({
      assistantMessage,
      promptMessage,
      signal,
    });

    if (!success) {
      return;
    }

    setSelectedReactionByMessage((current) => ({
      ...current,
      [assistantMessage.id]: signal,
    }));
  }

  async function handleAdminFeedbackSubmit(
    assistantMessage: ChatMessageLike,
    promptMessage: ChatMessageLike | null,
  ) {
    const draft =
      adminFeedbackDraftByMessage[assistantMessage.id]?.trim() ?? "";
    if (!draft) {
      setFeedbackStateByMessage((current) => ({
        ...current,
        [assistantMessage.id]: {
          message: copy.writeAdminFeedback,
          status: "error",
        },
      }));
      return;
    }

    const success = await submitFeedbackSignal({
      assistantMessage,
      feedbackText: draft,
      promptMessage,
      signal: "admin_feedback",
    });

    if (!success) {
      return;
    }

    setAdminFeedbackDraftByMessage((current) => ({
      ...current,
      [assistantMessage.id]: "",
    }));
  }

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-content space-y-3"
      width="standard"
      accents={[
        pageShellAccents.heroCopticBand,
        pageShellAccents.topRightGoldWashInset,
      ]}
    >
      <AppPageIntro
        breadcrumbs={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.shenute") },
        ]}
        description={copy.intro}
        spacing="compact"
        title={copy.title}
        tone="coptic"
      />

      <SurfacePanel
        rounded="3xl"
        shadow="panel"
        className="relative overflow-hidden"
      >
        {isShenuteAccessBlocked ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-surface/10 backdrop-brightness-95 dark:bg-paper/10"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-10">
              <AuthGateNotice
                actionClassName="px-6"
                align="center"
                className="w-full max-w-lg shadow-panel"
                size="comfortable"
                title={copy.title}
              >
                {copy.accessRequired}
              </AuthGateNotice>
            </div>
          </>
        ) : null}

        <div
          className={cx(
            "flex h-[calc(100dvh-18rem)] min-h-[24rem] flex-col transition-all duration-300 md:h-[calc(100dvh-16rem)] md:min-h-[28rem] lg:h-[calc(100dvh-17rem)] lg:min-h-[24rem]",
            isShenuteAccessBlocked &&
              "pointer-events-none select-none blur-[6px] opacity-70",
          )}
        >
          {sessions.length > 0 ? (
            <details className="border-b border-line bg-surface/70 px-4 py-2 md:px-5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
                    <Clock3 className="h-3.5 w-3.5" />
                  </span>
                  <p className="truncate text-sm font-semibold text-ink">
                    {copy.historySessions}
                  </p>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  {sessionStatus ? (
                    <span className="hidden truncate text-xs text-muted sm:inline">
                      {sessionStatus}
                    </span>
                  ) : null}
                  <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-elevated px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    {sessionCountLabel}
                  </span>
                </div>
              </summary>
              <div className="mt-2 rounded-lg border border-line bg-surface/85 p-3 shadow-soft">
                <div
                  aria-label={copy.historySessions}
                  className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
                >
                  {sessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const formattedSessionDate = formatSessionTimestamp(
                      session.updated_at,
                      language,
                      copy.sessionDateMissing,
                    );

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => void loadShenuteSession(session.id)}
                        disabled={isActive}
                        className={cx(
                          "flex w-64 shrink-0 snap-start flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition sm:w-72",
                          isActive
                            ? "border-coptic/55 bg-coptic-soft text-ink"
                            : "border-line bg-surface text-ink hover:border-accent/35 hover:bg-elevated",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-semibold">
                            {session.title || copy.historySessions}
                          </span>
                          <span
                            className={cx(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                              isActive
                                ? "bg-surface/80 text-coptic"
                                : "bg-elevated text-muted",
                            )}
                          >
                            {isActive ? copy.currentSession : copy.loadSession}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <Clock3 className="h-3 w-3" />
                          <span>{formattedSessionDate}</span>
                          {isActive && hasUnsavedConversationChanges ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent-strong dark:text-accent">
                              {copy.sessionUnsavedBadge}
                            </span>
                          ) : null}
                        </div>
                        {sessionLoadingId === session.id ? (
                          <p className="text-xs text-muted">
                            {copy.loadingSession}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
          ) : null}
          <div className="grid gap-2 border-b border-line bg-surface/75 px-4 py-2 text-sm text-muted md:px-5 sm:flex sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className={cx(
                  "h-2 w-2 shrink-0 rounded-full",
                  historyStatusDotClassName,
                )}
              />
              <p className="min-w-0 truncate text-xs sm:text-sm">
                {historyStatusMessage}
              </p>
              <span className="inline-flex max-w-full items-center rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold text-muted">
                <span className="truncate">
                  {copy.aiMode}: {selectedProviderOption.label}
                </span>
              </span>
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {typedMessages.length > 0 && !isTranscriptAtBottom ? (
                <button
                  type="button"
                  aria-label={copy.jumpToLatest}
                  title={copy.jumpToLatest}
                  onClick={scrollToLatestMessage}
                  className={buttonClassName({
                    size: "sm",
                    variant: "secondary",
                    className: "h-9 w-9 shrink-0 px-0 shadow-sm",
                  })}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                aria-controls="shenute-answer-style-panel"
                aria-expanded={isAnswerStylePanelOpen}
                aria-haspopup="dialog"
                aria-label={copy.answerStyleControls}
                title={copy.answerStyleControls}
                onClick={() => setIsAnswerStylePanelOpen((current) => !current)}
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                  className: cx(
                    "h-9 w-9 shrink-0 px-0",
                    isAnswerStylePanelOpen && "border-coptic/45 text-coptic",
                  ),
                })}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={copy.newConversation}
                title={copy.newConversation}
                onClick={() => void startNewConversation()}
                disabled={
                  isLoading || isHistorySaving || !canStartNewConversation
                }
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                  className: "h-9 w-9 shrink-0 px-0",
                })}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
              </button>
              <details className="group relative shrink-0">
                <summary
                  aria-label={copy.chatActions}
                  title={copy.chatActions}
                  className={buttonClassName({
                    size: "sm",
                    variant: "secondary",
                    className:
                      "h-9 w-9 cursor-pointer list-none px-0 [&::-webkit-details-marker]:hidden",
                  })}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </summary>
                <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-panel">
                  <button
                    type="button"
                    onClick={handleSaveHistory}
                    disabled={
                      typedMessages.length === 0 ||
                      isLoading ||
                      isHistorySaving ||
                      !hasUnsavedConversationChanges
                    }
                    className={buttonClassName({
                      fullWidth: true,
                      size: "sm",
                      variant: "secondary",
                      className: "h-9 justify-start gap-2 px-3 text-xs",
                    })}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saveButtonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void clearCurrentConversation()}
                    disabled={
                      isLoading ||
                      isHistorySaving ||
                      (!activeSessionId && typedMessages.length === 0)
                    }
                    className={buttonClassName({
                      fullWidth: true,
                      size: "sm",
                      variant: "secondary",
                      className:
                        "mt-2 h-9 justify-start gap-2 border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30",
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {copy.clearConversation}
                  </button>
                  <Link
                    href={`${getContributorsPath(language)}#shenute-ai-credits`}
                    className={buttonClassName({
                      fullWidth: true,
                      className: "mt-2 h-9 justify-start gap-2 px-3 text-xs",
                      size: "sm",
                      variant: "secondary",
                    })}
                  >
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    {copy.creditsShort}
                    <ArrowRight className="ml-auto h-3.5 w-3.5" />
                  </Link>
                </div>
              </details>
            </div>
          </div>
          {typedMessages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto border-b border-line bg-elevated/55 p-4 md:p-5">
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coptic-soft text-2xl text-coptic shadow-sm">
                    <span className="font-coptic leading-none">Ϣ</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold leading-6 text-ink md:text-lg">
                      {copy.welcomeTitle}
                    </h2>
                    <p className="hidden max-w-2xl truncate text-sm text-muted lg:block">
                      {copy.welcomeDescription}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {copy.starterPromptsTitle}
                  </p>
                  <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                    {starterPrompts.map((starterPrompt) => {
                      const Icon = starterPrompt.icon;

                      return (
                        <button
                          key={starterPrompt.prompt}
                          type="button"
                          onClick={() => {
                            handleStarterPrompt(starterPrompt.prompt);
                          }}
                          disabled={isLoading || isShenuteAccessBlocked}
                          className="group flex min-h-14 w-72 shrink-0 snap-start items-start gap-3 rounded-lg border border-line bg-surface/85 px-3 py-3 text-left text-sm font-medium leading-5 text-ink shadow-sm transition hover:border-coptic/35 hover:bg-coptic-soft/45 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                        >
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted transition group-hover:bg-coptic-soft group-hover:text-coptic">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            {starterPrompt.prompt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={transcriptScrollRef}
              aria-live="polite"
              onScroll={updateTranscriptScrollState}
              className="min-h-0 flex-1 overscroll-contain scroll-pb-6 space-y-5 overflow-y-auto border-b border-line bg-elevated/55 p-4 md:p-6"
            >
              {typedMessages.map((m, index) => {
                const assistantMessage = m as ChatMessageLike;
                const promptMessage =
                  m.role === "assistant"
                    ? findPreviousUserMessage(typedMessages, index)
                    : null;
                const feedbackState = feedbackStateByMessage[m.id];
                const messageActionState = messageActionStateByMessage[m.id];
                const selectedReaction = selectedReactionByMessage[m.id];
                const adminDraft = adminFeedbackDraftByMessage[m.id] ?? "";
                const isFeedbackPending = feedbackState?.status === "pending";
                const isLatestAssistantMessage =
                  m.role === "assistant" && index === typedMessages.length - 1;

                return (
                  <div
                    key={m.id}
                    className={cx(
                      "group flex w-full gap-2 sm:gap-3",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cx(
                        "mt-6 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm sm:flex",
                        getMessageAvatarClassName(m.role),
                        m.role === "user" && "order-2",
                      )}
                    >
                      {m.role === "user" ? (
                        <UserRound className="h-4 w-4" />
                      ) : (
                        <span className="font-coptic text-base leading-none">
                          Ϣ
                        </span>
                      )}
                    </div>
                    <div
                      className={cx(
                        "min-w-0",
                        m.role === "user"
                          ? "flex max-w-[88%] flex-col items-end sm:max-w-[70%]"
                          : "flex max-w-full flex-1 flex-col items-start sm:max-w-[52rem]",
                      )}
                    >
                      <div
                        className={cx(
                          "mb-1 flex flex-wrap items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted",
                          m.role === "user" && "justify-end text-right",
                        )}
                      >
                        <span>
                          {m.role === "user"
                            ? copy.userLabel
                            : copy.assistantLabel}
                        </span>
                        {isLatestAssistantMessage ? (
                          <span className="rounded-full bg-coptic-soft px-2 py-0.5 text-[0.65rem] tracking-normal text-coptic">
                            {getProviderLabel(inferenceProvider, copy)}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className={cx(
                          "max-w-full rounded-lg px-4 py-3",
                          m.role === "assistant" && "w-full sm:px-5 sm:py-4",
                          getMessageBubbleClassName(m.role),
                        )}
                      >
                        {(() => {
                          const text = getMessageText(m);
                          if (!text) {
                            return null;
                          }

                          return (
                            <div
                              className={cx(
                                "font-coptic text-[1.05rem] leading-7 md:text-lg md:leading-8",
                                m.role === "user"
                                  ? "text-paper dark:text-ink"
                                  : "text-ink",
                              )}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ ...props }) => (
                                    <a
                                      {...props}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={cx(
                                        "underline underline-offset-4",
                                        m.role === "user"
                                          ? "decoration-paper/60 hover:decoration-paper dark:decoration-ink/60 dark:hover:decoration-ink"
                                          : "decoration-line hover:decoration-coptic",
                                      )}
                                    />
                                  ),
                                  blockquote: ({ ...props }) => (
                                    <blockquote
                                      {...props}
                                      className={cx(
                                        "my-3 border-l-2 pl-3",
                                        m.role === "user"
                                          ? "border-paper/45 text-paper/85 dark:border-ink/45 dark:text-ink/85"
                                          : "border-line text-muted",
                                      )}
                                    />
                                  ),
                                  code: ({ className, children, ...props }) => (
                                    <code
                                      className={cx(
                                        "rounded px-1 py-0.5 text-[0.95em]",
                                        m.role === "user"
                                          ? "bg-paper/15 text-paper dark:bg-ink/10 dark:text-ink"
                                          : "bg-elevated text-ink",
                                        className,
                                      )}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  ),
                                  li: ({ ...props }) => (
                                    <li {...props} className="pl-1" />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol
                                      {...props}
                                      className="my-3 list-decimal space-y-1 pl-6"
                                    />
                                  ),
                                  p: ({ ...props }) => (
                                    <p {...props} className="mb-3 last:mb-0" />
                                  ),
                                  ul: ({ ...props }) => (
                                    <ul
                                      {...props}
                                      className="my-3 list-disc space-y-1 pl-6"
                                    />
                                  ),
                                }}
                              >
                                {text}
                              </ReactMarkdown>
                            </div>
                          );
                        })()}
                        {m.role === "assistant" ? (
                          <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs">
                            <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleCopyMessage(assistantMessage);
                                }}
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                  className: MESSAGE_ACTION_BUTTON_CLASS,
                                })}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {copy.copyResponse}
                              </button>
                              {isLatestAssistantMessage ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRegenerateMessage(assistantMessage);
                                    }}
                                    disabled={isLoading}
                                    className={buttonClassName({
                                      size: "sm",
                                      variant: "secondary",
                                      className: MESSAGE_ACTION_BUTTON_CLASS,
                                    })}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    {copy.regenerateResponse}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleContinueConversation}
                                    disabled={
                                      isLoading || isShenuteAccessBlocked
                                    }
                                    className={buttonClassName({
                                      size: "sm",
                                      variant: "secondary",
                                      className: MESSAGE_ACTION_BUTTON_CLASS,
                                    })}
                                  >
                                    <CornerDownRight className="h-3.5 w-3.5" />
                                    {copy.continueResponse}
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isSpeaking) {
                                    stopSpeech();
                                  } else {
                                    const text = getMessageText(m);
                                    if (text) {
                                      void speakMixed(text);
                                    }
                                  }
                                }}
                                disabled={isPremiumLoading}
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                  className: cx(
                                    MESSAGE_ACTION_BUTTON_CLASS,
                                    isSpeaking &&
                                      "border-coptic/55 text-coptic",
                                  ),
                                })}
                              >
                                {isSpeaking ? (
                                  <Square className="h-3.5 w-3.5 fill-current" />
                                ) : (
                                  <Volume2 className="h-3.5 w-3.5" />
                                )}
                                {isSpeaking ? copy.stop : copy.play}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleReaction(
                                    "like",
                                    assistantMessage,
                                    promptMessage,
                                  );
                                }}
                                disabled={!isAuthenticated || isFeedbackPending}
                                aria-pressed={selectedReaction === "like"}
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                  className: cx(
                                    MESSAGE_ACTION_BUTTON_CLASS,
                                    getReactionButtonClassName(
                                      selectedReaction === "like",
                                      "positive",
                                    ),
                                  ),
                                })}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {copy.like}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleReaction(
                                    "dislike",
                                    assistantMessage,
                                    promptMessage,
                                  );
                                }}
                                disabled={!isAuthenticated || isFeedbackPending}
                                aria-pressed={selectedReaction === "dislike"}
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                  className: cx(
                                    MESSAGE_ACTION_BUTTON_CLASS,
                                    getReactionButtonClassName(
                                      selectedReaction === "dislike",
                                      "negative",
                                    ),
                                  ),
                                })}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                {copy.dislike}
                              </button>
                            </div>

                            {messageActionState ? (
                              <p
                                className={getFeedbackStatusClass(
                                  messageActionState.status,
                                )}
                              >
                                {messageActionState.message}
                              </p>
                            ) : null}

                            {canSubmitAdminFeedback ? (
                              <details className="rounded-lg border border-line bg-elevated/70 p-3">
                                <summary className="cursor-pointer font-semibold text-ink">
                                  {copy.adminNoteSummary}
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={adminDraft}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setAdminFeedbackDraftByMessage(
                                        (current) => ({
                                          ...current,
                                          [m.id]: value,
                                        }),
                                      );
                                    }}
                                    placeholder={copy.adminNotePlaceholder}
                                    rows={3}
                                    disabled={isFeedbackPending}
                                    className="w-full rounded-lg border border-line bg-surface/85 px-3 py-2 text-xs text-ink shadow-sm focus:border-accent/55 focus:outline-none focus:ring-2 focus:ring-accent/25"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleAdminFeedbackSubmit(
                                        assistantMessage,
                                        promptMessage,
                                      );
                                    }}
                                    disabled={isFeedbackPending}
                                    className={buttonClassName({
                                      size: "sm",
                                      variant: "secondary",
                                    })}
                                  >
                                    {copy.submitAdminNote}
                                  </button>
                                </div>
                              </details>
                            ) : null}

                            {feedbackState ? (
                              <p
                                className={getFeedbackStatusClass(
                                  feedbackState.status,
                                )}
                              >
                                {feedbackState.message}
                              </p>
                            ) : null}

                            {!isAuthenticated && isReady ? (
                              <AuthGateInlinePrompt
                                className="text-xs"
                                message={copy.feedbackSignInInline}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="mr-auto flex w-full max-w-[52rem] gap-2 sm:gap-3">
                  <div
                    className={cx(
                      "mt-6 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm sm:flex",
                      getMessageAvatarClassName("assistant"),
                    )}
                  >
                    <span className="font-coptic text-base leading-none">
                      Ϣ
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {copy.assistantLabel}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 rounded-lg rounded-bl-sm border border-line bg-surface/95 px-4 py-3 shadow-soft ring-1 ring-line/60">
                      <span className="text-sm font-semibold text-ink">
                        {copy.thinking}{" "}
                        {formatElapsedTime(thinkingElapsedSeconds)}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex items-center gap-1"
                      >
                        <span className="h-2 w-2 animate-bounce rounded-full bg-coptic delay-100" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-coptic delay-200" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-coptic delay-300" />
                      </span>
                      <button
                        type="button"
                        onClick={stopChatResponse}
                        className={buttonClassName({
                          size: "sm",
                          variant: "secondary",
                          className: "h-8 gap-2 px-2 text-xs",
                        })}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {copy.cancelResponse}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="sticky bottom-0 z-20 border-t border-line bg-surface/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_30px_rgba(30,29,29,0.08)] backdrop-blur-xl dark:shadow-[0_-18px_30px_rgba(0,0,0,0.35)] md:p-4 md:pb-4"
          >
            {shenuteAccessError || error || ocrError || cameraError ? (
              <div className="mb-3 space-y-3">
                {shenuteAccessError ? (
                  <AuthGateNotice align="left" size="compact">
                    {shenuteAccessError}
                  </AuthGateNotice>
                ) : null}
                {error ? (
                  <StatusNotice tone="error" align="left">
                    {getShenuteErrorMessage(error, copy)}
                  </StatusNotice>
                ) : null}
                {ocrError ? (
                  <StatusNotice tone="error" align="left">
                    {ocrError}
                  </StatusNotice>
                ) : null}
                {cameraError ? (
                  <StatusNotice tone="info" align="left">
                    {cameraError}
                  </StatusNotice>
                ) : null}
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setImageAttachment(file, "upload");
                }
              }}
            />

            {cameraOpen ? (
              <SurfacePanel
                rounded="3xl"
                variant="subtle"
                shadow="soft"
                className="mb-3 p-4"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mb-3 w-full rounded-lg border border-line"
                />
                <canvas ref={captureCanvasRef} className="hidden" />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "primary",
                      className: "gap-2",
                    })}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {copy.cameraCapture}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className: "gap-2",
                    })}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {copy.cameraClose}
                  </button>
                </div>
              </SurfacePanel>
            ) : null}

            <SurfacePanel
              rounded="3xl"
              variant="subtle"
              shadow="soft"
              className="p-2"
            >
              {selectedImagePreviewUrl ? (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-line bg-surface/85 p-2 shadow-sm">
                  <Image
                    unoptimized
                    src={selectedImagePreviewUrl}
                    alt={copy.selectedImageAlt}
                    width={72}
                    height={72}
                    className="h-14 w-14 shrink-0 rounded-lg border border-line bg-elevated object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-ink">
                        {copy.attachmentReady}
                      </span>
                      <Badge tone="accent" size="xs">
                        {selectedImageSource === "camera"
                          ? copy.cameraSource
                          : copy.uploadSource}
                      </Badge>
                      {ocrPending ? (
                        <Badge tone="neutral" size="xs">
                          {copy.runningOcr}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted">
                      {selectedImage?.name ?? copy.imageAttached}
                    </p>
                    {selectedImageSizeLabel ? (
                      <p className="text-xs text-muted">
                        {selectedImageSizeLabel}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={copy.remove}
                    title={copy.remove}
                    onClick={clearSelectedImage}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className:
                        "h-8 w-8 shrink-0 border-rose-200 px-0 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30",
                    })}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <details className="group relative shrink-0">
                  <summary
                    aria-disabled={isAttachmentMenuDisabled}
                    aria-label={`${copy.addImage} / ${copy.useCamera}`}
                    title={`${copy.addImage} / ${copy.useCamera}`}
                    className={cx(
                      buttonClassName({
                        size: "sm",
                        variant: "secondary",
                        className:
                          "h-12 w-12 cursor-pointer list-none rounded-lg px-0 [&::-webkit-details-marker]:hidden",
                      }),
                      isAttachmentMenuDisabled &&
                        "pointer-events-none opacity-55",
                    )}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </summary>
                  <div className="absolute bottom-full left-0 z-30 mb-2 w-52 rounded-lg border border-line bg-surface p-2 shadow-panel">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        fileInputRef.current?.click();
                      }}
                      disabled={isAttachmentMenuDisabled}
                      className={buttonClassName({
                        fullWidth: true,
                        size: "sm",
                        variant: "secondary",
                        className: "h-9 justify-start gap-2 px-3 text-xs",
                      })}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {copy.addImage}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        void openCamera();
                      }}
                      disabled={isAttachmentMenuDisabled || cameraOpen}
                      className={buttonClassName({
                        fullWidth: true,
                        size: "sm",
                        variant: "secondary",
                        className: "mt-2 h-9 justify-start gap-2 px-3 text-xs",
                      })}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {copy.useCamera}
                    </button>
                  </div>
                </details>
                <textarea
                  ref={messageInputRef}
                  id="shenute-message-input"
                  name="shenute_message"
                  rows={1}
                  enterKeyHint="send"
                  className="max-h-40 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg border-0 bg-transparent px-4 py-3 font-coptic text-lg leading-7 text-ink outline-none ring-0 placeholder:text-muted/65 focus:outline-none focus:ring-0 md:text-xl"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    if (shenuteAccessError) {
                      setShenuteAccessError(null);
                    }
                  }}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={copy.placeholder}
                  disabled={isLoading || ocrPending || isShenuteAccessBlocked}
                />
                <button
                  type="submit"
                  aria-label={copy.sendMessage}
                  disabled={
                    (!inputValue.trim() && !selectedImage) ||
                    isLoading ||
                    ocrPending ||
                    isShenuteAccessBlocked
                  }
                  className={buttonClassName({
                    size: "sm",
                    variant: "primary",
                    className: "h-12 w-12 shrink-0 rounded-lg px-0",
                  })}
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </SurfacePanel>
          </form>
        </div>
      </SurfacePanel>

      {isAnswerStylePanelOpen ? (
        <>
          <button
            type="button"
            aria-label={copy.closeAnswerStyleControls}
            tabIndex={-1}
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
            onClick={() => setIsAnswerStylePanelOpen(false)}
          />
          <div
            id="shenute-answer-style-panel"
            role="dialog"
            aria-labelledby="shenute-answer-style-label"
            className="fixed left-1/2 top-[calc(var(--app-sticky-offset)_+_0.75rem)] z-[70] max-h-[calc(100dvh_-_var(--app-sticky-offset)_-_1.5rem)] w-[min(28rem,calc(100vw_-_2rem))] -translate-x-1/2 overflow-y-auto rounded-lg border border-line bg-surface p-3 shadow-panel"
          >
            <p
              id="shenute-answer-style-label"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted"
            >
              {copy.aiMode}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {copy.aiModeDescription}
            </p>
            <div
              role="radiogroup"
              aria-labelledby="shenute-answer-style-label"
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              {providerOptions.map((option) => {
                const Icon = option.icon;
                const isActive = option.value === inferenceProvider;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${option.label}. ${option.description}`}
                    onClick={() => {
                      setInferenceProvider(option.value);
                      setIsAnswerStylePanelOpen(false);
                    }}
                    disabled={isLoading || isShenuteAccessBlocked}
                    className={cx(
                      "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      isActive
                        ? "border-coptic/55 bg-coptic-soft text-ink shadow-sm"
                        : "border-line bg-surface/80 text-muted hover:border-accent/35 hover:bg-elevated hover:text-ink",
                    )}
                  >
                    <span
                      className={cx(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        isActive
                          ? "bg-coptic text-paper"
                          : "bg-elevated text-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-5">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 rounded-lg border border-line bg-elevated px-3 py-2 text-xs leading-5 text-muted">
              <span className="font-semibold text-ink">
                {selectedProviderOption.label}:
              </span>{" "}
              {selectedProviderOption.description}
            </p>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
