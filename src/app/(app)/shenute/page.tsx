"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowRight, BookOpenCheck, Square, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { processOCRImage } from "@/actions/ocrActions";
import {
  AuthGateInlinePrompt,
  AuthGateNotice,
} from "@/components/AuthGateNotice";
import { Badge } from "@/components/Badge";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { StatusNotice } from "@/components/StatusNotice";
import { SurfacePanel } from "@/components/SurfacePanel";
import { useSpeech } from "@/features/dictionary/hooks/useSpeech";
import { cx } from "@/lib/classes";
import { getContributorsPath, getLocalizedHomePath } from "@/lib/locale";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";

type ShenuteProvider = "gemini" | "hf" | "openrouter" | "thoth";

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

const SHENUTE_COPY = {
  en: {
    accessRequired: "Please sign in to access Shenute AI.",
    addImage: "Add Image",
    adminNotePlaceholder:
      "Admin only: add written feedback tied to this prompt and response.",
    adminNoteSummary: "Admin note for RAG learning",
    aiMode: "AI mode",
    cameraCapture: "Capture Image",
    cameraClose: "Close Camera",
    cameraFrameFailed: "Could not capture camera frame.",
    cameraImageFailed: "Could not capture image from camera.",
    cameraNotReady: "Camera is not ready.",
    cameraNotSupported: "Camera is not supported on this device/browser.",
    cameraStillLoading: "Camera feed is not ready yet. Try again.",
    cameraSource: "camera",
    creditsLinkDescription:
      "Credits, technical notes, and research acknowledgements now live on the Contributors page.",
    creditsLinkTitle: "Credits and technical notes",
    dislike: "Dislike",
    feedbackPromptMissing:
      "Could not resolve prompt/response for this feedback.",
    feedbackSaved: "Saved.",
    feedbackSavedWithRag: "Saved and added to RAG learning.",
    feedbackSaveFailed: "Could not save feedback.",
    feedbackSaving: "Saving feedback...",
    feedbackSignIn: "Sign in to send feedback signals.",
    feedbackSignInInline: "Sign in to send learning feedback signals",
    imageAttached: "Image attached",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Ask about Coptic vocabulary, grammar, translation, and manuscript context without leaving the shared app workspace.",
    like: "Like",
    noTextExtracted: "No text extracted from the selected image.",
    ocrFailed: "OCR failed for the selected image.",
    placeholder: "Ask about a Coptic word, grammar rule, or attached image...",
    saveHistory: "Save chat history",
    savedHistory: "Chat history downloaded.",
    autosaveStatus: "Autosaved locally",
    historySessions: "Saved sessions",
    historySessionsDescription:
      "Switch between your saved Shenute conversations.",
    loadSession: "Load",
    currentSession: "Current",
    loadingSession: "Loading session...",
    sessionCount: "sessions",
    sessionDateMissing: "No timestamp",
    providerGemini: "Learner (Gemini)",
    providerHf: "Learner (HF)",
    providerOpenRouter: "Learner (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "Saved. RAG ingest warning:",
    rateLimit: "Rate limit reached. Please try again later.",
    remove: "Remove",
    requestFailed: "AI request failed.",
    runningOcr: "Running OCR...",
    sendMessage: "Send message",
    selectedImageAlt: "Selected for OCR",
    submitAdminNote: "Submit admin note",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Use Camera",
    viewNmtCredits: "View NMT credits",
    viewShenuteCredits: "View Shenute credits",
    welcomeDescription:
      "Start with a word, a grammar question, or an image attachment and Shenute AI will keep the conversation grounded in your Coptic study workflow.",
    welcomeTitle: "Welcome to Shenute AI",
    writeAdminFeedback: "Write admin feedback before submitting.",
    play: "Speak",
    stop: "Stop",
  },
  nl: {
    accessRequired: "Meld u aan om Shenute AI te gebruiken.",
    addImage: "Afbeelding toevoegen",
    adminNotePlaceholder:
      "Alleen voor beheerders: voeg feedback toe bij deze prompt en dit antwoord.",
    adminNoteSummary: "Beheerdersnotitie voor RAG-learning",
    aiMode: "AI-modus",
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
    creditsLinkDescription:
      "Credits, technische notities en onderzoeksvermeldingen staan nu op de bijdragerspagina.",
    creditsLinkTitle: "Credits en technische notities",
    dislike: "Niet nuttig",
    feedbackPromptMissing:
      "De prompt en het antwoord voor deze feedback konden niet worden bepaald.",
    feedbackSaved: "Opgeslagen.",
    feedbackSavedWithRag: "Opgeslagen en toegevoegd aan RAG-learning.",
    feedbackSaveFailed: "Feedback kon niet worden opgeslagen.",
    feedbackSaving: "Feedback opslaan...",
    feedbackSignIn: "Meld u aan om feedbacksignalen te verzenden.",
    feedbackSignInInline: "Meld u aan om leerfeedback te verzenden",
    imageAttached: "Afbeelding toegevoegd",
    imageOcrContext: "[Image OCR Context]",
    intro:
      "Stel vragen over Koptische woordenschat, grammatica, vertaling en manuscriptcontext zonder de gedeelde werkruimte te verlaten.",
    like: "Nuttig",
    noTextExtracted:
      "Er is geen tekst uit de geselecteerde afbeelding gehaald.",
    ocrFailed: "OCR is mislukt voor de geselecteerde afbeelding.",
    placeholder:
      "Vraag naar een Koptisch woord, een grammaticaregel of een toegevoegde afbeelding...",
    saveHistory: "Chatgeschiedenis opslaan",
    savedHistory: "Chatgeschiedenis online opgeslagen.",
    autosaveStatus: "Automatisch online opgeslagen",
    historySessions: "Opgeslagen sessies",
    historySessionsDescription:
      "Schakel tussen je opgeslagen Shenute-gesprekken.",
    loadSession: "Laden",
    currentSession: "Huidig",
    loadingSession: "Sessieweergave laden...",
    sessionCount: "sessies",
    sessionDateMissing: "Geen tijdstempel",
    providerGemini: "Leerhulp (Gemini)",
    providerHf: "Leerhulp (HF)",
    providerOpenRouter: "Leerhulp (OpenRouter)",
    providerThoth: "Expert (THOTH AI)",
    ragWarning: "Opgeslagen. RAG-ingest-waarschuwing:",
    rateLimit: "De limiet is bereikt. Probeer het later opnieuw.",
    remove: "Verwijderen",
    requestFailed: "AI-verzoek mislukt.",
    runningOcr: "OCR uitvoeren...",
    sendMessage: "Bericht verzenden",
    selectedImageAlt: "Geselecteerd voor OCR",
    submitAdminNote: "Beheerdersnotitie verzenden",
    title: "Shenute AI",
    uploadSource: "upload",
    useCamera: "Camera gebruiken",
    viewNmtCredits: "Bekijk NMT-credits",
    viewShenuteCredits: "Bekijk Shenute-credits",
    welcomeDescription:
      "Begin met een woord, een grammaticavraag of een afbeelding. Shenute AI houdt het gesprek verbonden met uw Koptische studiewerkstroom.",
    welcomeTitle: "Welkom bij Shenute AI",
    writeAdminFeedback: "Schrijf beheerdersfeedback voordat u die verzendt.",
    play: "Spreken",
    stop: "Stop",
  },
} as const;

type ShenuteCopy = (typeof SHENUTE_COPY)[keyof typeof SHENUTE_COPY];

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
): Promise<{ success: boolean; sessionId?: string }> {
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

function toShenuteProvider(value: string): ShenuteProvider {
  if (value === "gemini") {
    return "gemini";
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
    return "text-slate-600 dark:text-slate-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function getMessageAvatarClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "bg-sky-600 text-white dark:bg-sky-500";
  }

  return "bg-emerald-600 text-white dark:bg-emerald-500";
}

function getMessageBubbleClassName(role: ChatMessageLike["role"]) {
  if (role === "user") {
    return "bg-sky-600 text-white shadow-md dark:bg-sky-500 rounded-tr-sm";
  }

  return "rounded-tl-sm border border-stone-200 bg-white/90 text-stone-800 shadow-sm dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200";
}

function getReactionButtonClassName(
  active: boolean,
  tone: "negative" | "positive",
) {
  if (active && tone === "positive") {
    return "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  if (active && tone === "negative") {
    return "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  }

  return "border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800";
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shenuteSessionIdRef = useRef(crypto.randomUUID());

  const { isAuthenticated, isReady } = useOptionalAuthGate();
  const [selectedReactionByMessage, setSelectedReactionByMessage] = useState<
    Record<string, ShenuteReactionSignal>
  >({});
  const [adminFeedbackDraftByMessage, setAdminFeedbackDraftByMessage] =
    useState<Record<string, string>>({});
  const [feedbackStateByMessage, setFeedbackStateByMessage] =
    useState<FeedbackStateByMessage>({});
  const isSavingRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/shenute",
      }),
    [],
  );

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
  });

  const { speakMixed, stop, isSpeaking, isPremiumLoading } = useSpeech();

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionLoadingId, setSessionLoadingId] = useState<string | null>(null);
  const [hasRestoredHistory, setHasRestoredHistory] = useState(false);
  const isLoading = status !== "ready";
  const isShenuteAccessBlocked = isReady && !isAuthenticated;
  const typedMessages = messages as ChatMessageLike[];

  useEffect(() => {
    if (typedMessages.length === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, typedMessages.length]);

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
            setMessages(payload.messages as UIMessage[]);
          }
        }
      } catch {
        // ignore restore failures
      } finally {
        setHasRestoredHistory(true);
      }
    };

    void restoreHistory();
  }, [hasRestoredHistory, isAuthenticated, isReady, setMessages]);

  useEffect(() => {
    if (
      typedMessages.length === 0 ||
      !isReady ||
      !isAuthenticated ||
      !hasRestoredHistory
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      void saveChatHistoryOnline(
        typedMessages,
        shenuteSessionIdRef.current,
      ).then((result) => {
        isSavingRef.current = false;
        if (result.success) {
          if (result.sessionId) {
            shenuteSessionIdRef.current = result.sessionId;
            setActiveSessionId(result.sessionId);
          }
          setAutosaveStatus(copy.autosaveStatus);
        }
      });
    }, 1000);

    const clearTimer = () => window.clearTimeout(timer);
    return clearTimer;
  }, [
    typedMessages,
    copy.autosaveStatus,
    hasRestoredHistory,
    isReady,
    isAuthenticated,
  ]);

  function handleSaveHistory() {
    void saveChatHistoryOnline(typedMessages, shenuteSessionIdRef.current).then(
      (result) => {
        if (result.success) {
          if (result.sessionId) {
            shenuteSessionIdRef.current = result.sessionId;
            setActiveSessionId(result.sessionId);
          }
          setSaveStatus(copy.savedHistory);
          window.setTimeout(() => {
            setSaveStatus(null);
          }, 2500);
        }
      },
    );
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
      setMessages(
        Array.isArray(payload.messages)
          ? (payload.messages as UIMessage[])
          : [],
      );
      setActiveSessionId(payload.sessionId);
      shenuteSessionIdRef.current = payload.sessionId;

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
      contentClassName="w-full space-y-6 pt-8 md:pt-10"
      width="wide"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <BreadcrumbTrail
        items={[
          { label: t("nav.home"), href: getLocalizedHomePath(language) },
          { label: t("nav.shenute") },
        ]}
      />

      <PageHeader
        title={copy.title}
        description={copy.intro}
        align="left"
        size="workspace"
        tone="sky"
        titleClassName="pb-0"
      />

      <SurfacePanel
        rounded="3xl"
        shadow="soft"
        variant="subtle"
        className="overflow-hidden"
      >
        <div className="grid divide-y divide-stone-200/80 dark:divide-stone-800/80 lg:grid-cols-[18rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
          <label className="flex min-w-0 flex-col gap-2 p-4 text-sm font-medium text-stone-600 dark:text-stone-300 md:p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
              {copy.aiMode}
            </span>
            <select
              id="shenute-inference-provider"
              name="shenute_inference_provider"
              className="compact-select-base h-11 w-full bg-white/85 text-sm dark:bg-stone-900"
              value={inferenceProvider}
              onChange={(event) => {
                setInferenceProvider(toShenuteProvider(event.target.value));
              }}
              disabled={isLoading || isShenuteAccessBlocked}
            >
              <option value="thoth">{copy.providerThoth}</option>
              <option value="gemini">{copy.providerGemini}</option>
              <option value="openrouter">{copy.providerOpenRouter}</option>
              <option value="hf">{copy.providerHf}</option>
            </select>
          </label>

          <div className="min-w-0 p-4 md:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
                  <BookOpenCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {copy.creditsLinkTitle}
                  </h2>
                  <p className="max-w-2xl text-xs leading-5 text-stone-600 dark:text-stone-400">
                    {copy.creditsLinkDescription}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`${getContributorsPath(language)}#shenute-ai-credits`}
                  className={buttonClassName({
                    className: "h-9 px-3 text-xs",
                    size: "sm",
                    variant: "secondary",
                  })}
                >
                  {copy.viewShenuteCredits}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`${getContributorsPath(language)}#research-nmt-credits`}
                  className={buttonClassName({
                    className: "h-9 px-3 text-xs",
                    size: "sm",
                    variant: "secondary",
                  })}
                >
                  {copy.viewNmtCredits}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel
        rounded="4xl"
        shadow="float"
        className="relative overflow-hidden"
      >
        {isShenuteAccessBlocked ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-white/10 backdrop-brightness-95 dark:bg-stone-950/10"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-10">
              <AuthGateNotice
                actionClassName="px-6"
                align="center"
                className="w-full max-w-lg shadow-xl"
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
            "flex min-h-[72vh] flex-col transition-all duration-300",
            isShenuteAccessBlocked &&
              "pointer-events-none select-none blur-[6px] opacity-70",
          )}
        >
          {sessions.length > 0 ? (
            <div className="mb-4 rounded-3xl border border-stone-200 bg-white/80 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-950/70">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {copy.historySessions}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {copy.historySessionsDescription}
                  </p>
                  {sessionStatus ? (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {sessionStatus}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:bg-stone-900 dark:text-stone-300">
                  {sessions.length} {copy.sessionCount}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => void loadShenuteSession(session.id)}
                      disabled={isActive}
                      className={cx(
                        "flex w-full flex-col gap-1 rounded-3xl border px-4 py-3 text-left text-sm transition",
                        isActive
                          ? "border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950/70 dark:text-sky-100"
                          : "border-stone-200 bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950/70 dark:text-stone-100 dark:hover:border-stone-500 dark:hover:bg-stone-900",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">
                          {session.title || copy.historySessions}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {isActive ? copy.currentSession : copy.loadSession}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {session.updated_at
                          ? new Date(session.updated_at).toLocaleString()
                          : copy.sessionDateMissing}
                      </p>
                      {sessionLoadingId === session.id ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {copy.loadingSession}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 md:p-12">
              <SurfacePanel
                rounded="4xl"
                variant="subtle"
                shadow="soft"
                className="max-w-xl p-8 text-center"
              >
                <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-3xl text-sky-700 shadow-sm dark:bg-sky-900/30 dark:text-sky-300">
                  <span className="font-coptic leading-none">Ϣ</span>
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  {copy.welcomeTitle}
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  {copy.welcomeDescription}
                </p>
              </SurfacePanel>
            </div>
          ) : (
            <div
              aria-live="polite"
              className="flex-1 space-y-5 overflow-y-auto border-b border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/30 md:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white/70 px-4 py-3 text-sm text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-950/70 dark:text-stone-300 md:px-5">
                <p>{autosaveStatus ?? copy.autosaveStatus}</p>
                <div className="flex items-center gap-3">
                  {saveStatus ? (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      {saveStatus}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSaveHistory}
                    disabled={typedMessages.length === 0}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                    })}
                  >
                    {copy.saveHistory}
                  </button>
                </div>
              </div>
              {messages.map((m, index) => {
                const assistantMessage = m as ChatMessageLike;
                const promptMessage =
                  m.role === "assistant"
                    ? findPreviousUserMessage(typedMessages, index)
                    : null;
                const feedbackState = feedbackStateByMessage[m.id];
                const selectedReaction = selectedReactionByMessage[m.id];
                const adminDraft = adminFeedbackDraftByMessage[m.id] ?? "";
                const isFeedbackPending = feedbackState?.status === "pending";

                return (
                  <div
                    key={m.id}
                    className={cx(
                      "flex max-w-[85%] gap-3",
                      m.role === "user"
                        ? "ml-auto flex-row-reverse"
                        : "mr-auto",
                    )}
                  >
                    <div
                      className={cx(
                        "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                        getMessageAvatarClassName(m.role),
                      )}
                    >
                      {m.role === "user" ? (
                        "U"
                      ) : (
                        <span className="font-coptic text-base leading-none">
                          Ϣ
                        </span>
                      )}
                    </div>
                    <div
                      className={cx(
                        "rounded-2xl px-4 py-3 font-coptic text-lg leading-relaxed md:text-xl",
                        getMessageBubbleClassName(m.role),
                      )}
                    >
                      {(() => {
                        const text = getMessageText(m);
                        if (!text) {
                          return null;
                        }

                        return (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                />
                              ),
                              code: ({ className, children, ...props }) => (
                                <code
                                  className={`rounded bg-stone-200/70 px-1 py-0.5 text-[0.95em] dark:bg-stone-800 ${className || ""}`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {text}
                          </ReactMarkdown>
                        );
                      })()}
                      {m.role === "assistant" ? (
                        <div className="mt-3 space-y-2 border-t border-stone-200 pt-3 text-xs dark:border-stone-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSpeaking) {
                                  stop();
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
                                  "gap-2",
                                  isSpeaking &&
                                    "border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-300",
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
                                className: getReactionButtonClassName(
                                  selectedReaction === "like",
                                  "positive",
                                ),
                              })}
                            >
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
                                className: getReactionButtonClassName(
                                  selectedReaction === "dislike",
                                  "negative",
                                ),
                              })}
                            >
                              {copy.dislike}
                            </button>
                          </div>

                          <details className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-950/30">
                            <summary className="cursor-pointer font-semibold text-stone-700 dark:text-stone-200">
                              {copy.adminNoteSummary}
                            </summary>
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={adminDraft}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setAdminFeedbackDraftByMessage((current) => ({
                                    ...current,
                                    [m.id]: value,
                                  }));
                                }}
                                placeholder={copy.adminNotePlaceholder}
                                rows={3}
                                disabled={!isAuthenticated || isFeedbackPending}
                                className="w-full rounded-xl border border-stone-200 bg-white/85 px-3 py-2 text-xs text-stone-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/35 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  void handleAdminFeedbackSubmit(
                                    assistantMessage,
                                    promptMessage,
                                  );
                                }}
                                disabled={!isAuthenticated || isFeedbackPending}
                                className={buttonClassName({
                                  size: "sm",
                                  variant: "secondary",
                                })}
                              >
                                {copy.submitAdminNote}
                              </button>
                            </div>
                          </details>

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
                );
              })}

              {isLoading ? (
                <div className="mr-auto flex max-w-[85%] items-center gap-3">
                  <div
                    className={cx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                      getMessageAvatarClassName("assistant"),
                    )}
                  >
                    <span className="font-coptic text-base leading-none">
                      Ϣ
                    </span>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-100" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-200" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-stone-400 delay-300" />
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="bg-white/70 p-4 dark:bg-stone-950/40 md:p-6"
          >
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
                  className="mb-3 w-full rounded-2xl border border-stone-200 dark:border-stone-700"
                />
                <canvas ref={captureCanvasRef} className="hidden" />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "primary",
                    })}
                  >
                    {copy.cameraCapture}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                    })}
                  >
                    {copy.cameraClose}
                  </button>
                </div>
              </SurfacePanel>
            ) : null}

            {selectedImagePreviewUrl ? (
              <SurfacePanel
                rounded="3xl"
                variant="subtle"
                shadow="soft"
                className="mb-3 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
                    {copy.imageAttached} (
                    {selectedImageSource === "camera"
                      ? copy.cameraSource
                      : copy.uploadSource}
                    )
                  </p>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className={buttonClassName({
                      size: "sm",
                      variant: "link",
                    })}
                  >
                    {copy.remove}
                  </button>
                </div>
                <Image
                  unoptimized
                  src={selectedImagePreviewUrl}
                  alt={copy.selectedImageAlt}
                  width={384}
                  height={192}
                  className="max-h-48 w-auto object-contain rounded-2xl border border-stone-200 dark:border-stone-700"
                />
              </SurfacePanel>
            ) : null}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isLoading || ocrPending || isShenuteAccessBlocked}
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                })}
              >
                {copy.addImage}
              </button>
              <button
                type="button"
                onClick={() => {
                  void openCamera();
                }}
                disabled={
                  isLoading ||
                  ocrPending ||
                  cameraOpen ||
                  isShenuteAccessBlocked
                }
                className={buttonClassName({
                  size: "sm",
                  variant: "secondary",
                })}
              >
                {copy.useCamera}
              </button>
              {ocrPending ? (
                <Badge tone="accent" size="xs">
                  {copy.runningOcr}
                </Badge>
              ) : null}
            </div>

            <SurfacePanel
              rounded="3xl"
              variant="subtle"
              shadow="soft"
              className="p-2"
            >
              <div className="flex items-end gap-2">
                <textarea
                  id="shenute-message-input"
                  name="shenute_message"
                  rows={1}
                  enterKeyHint="send"
                  className="max-h-40 min-h-12 min-w-0 flex-1 resize-y rounded-[1.25rem] border-0 bg-transparent px-4 py-3 font-coptic text-lg leading-7 text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:text-stone-100 dark:placeholder:text-stone-500 md:text-xl"
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
                    className:
                      "h-10 w-10 shrink-0 rounded-xl px-0 disabled:hover:bg-sky-500 dark:disabled:hover:bg-sky-400",
                  })}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </SurfacePanel>
          </form>
        </div>
      </SurfacePanel>
    </PageShell>
  );
}
