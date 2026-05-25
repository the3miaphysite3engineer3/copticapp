"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Camera,
  Download,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Minus,
  ScanText,
  SendHorizontal,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { processOCRImage } from "@/actions/ocrActions";
import {
  AuthGateInlinePrompt,
  AuthGateNotice,
} from "@/components/AuthGateNotice";
import { Badge } from "@/components/Badge";
import {
  buttonClassName,
  iconButtonClassName as sharedIconButtonClassName,
} from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { cx } from "@/lib/classes";
import { useOptionalAuthGate } from "@/lib/supabase/useOptionalAuthGate";
import type { Language } from "@/types/i18n";

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

type ShenuteFeedbackSignal = "admin_feedback" | "dislike" | "like";
type ShenuteReactionSignal = Extract<ShenuteFeedbackSignal, "dislike" | "like">;

type FeedbackStateByMessage = Record<
  string,
  {
    message: string;
    status: "error" | "pending" | "success";
  }
>;

type PageContextPayload = {
  excerpt: string;
  path: string;
  title: string;
  url: string;
};

const SITE_TITLE_SUFFIX_PATTERN = /\s+\|\s+Coptic Compass$/;
const LAUNCHER_SCROLLING_OPACITY = 0.52;
const LAUNCHER_SCROLL_IDLE_DELAY_MS = 720;

const PAGE_CONTEXT_LABELS: Record<Language, Record<string, string>> = {
  en: {
    admin: "Admin",
    analytics: "Analytics",
    "api-docs": "API docs",
    communications: "Communications",
    contact: "Contact",
    contributors: "Contributors",
    dashboard: "Dashboard",
    developers: "Developers",
    dictionary: "Dictionary",
    entry: "Dictionary",
    "forgot-password": "Forgot password",
    grammar: "Grammar",
    home: "Home",
    login: "Sign in",
    ocr: "OCR",
    privacy: "Privacy",
    publications: "Publications",
    shenute: "Shenute AI",
    terms: "Terms",
    "update-password": "Update password",
  },
  nl: {
    admin: "Admin",
    analytics: "Analytics",
    "api-docs": "API-documentatie",
    communications: "Communicatie",
    contact: "Contact",
    contributors: "Bijdragers",
    dashboard: "Dashboard",
    developers: "Ontwikkelaars",
    dictionary: "Woordenboek",
    entry: "Woordenboek",
    "forgot-password": "Wachtwoord vergeten",
    grammar: "Grammatica",
    home: "Home",
    login: "Inloggen",
    ocr: "OCR",
    privacy: "Privacy",
    publications: "Publicaties",
    shenute: "Shenute AI",
    terms: "Voorwaarden",
    "update-password": "Wachtwoord bijwerken",
  },
};

const floatingShenuteCopy = {
  en: {
    addImage: "Add image",
    adminNotePlaceholder:
      "Admin only: add written feedback tied to this prompt/response.",
    adminNoteTitle: "Admin learning note",
    camera: "Camera",
    cameraAccessFailed: "Could not access camera.",
    cameraFeedNotReady: "Camera feed is not ready yet. Try again.",
    cameraNotReady: "Camera is not ready.",
    cameraUnsupported: "Camera is not supported on this device/browser.",
    capture: "Capture",
    captureFailed: "Could not capture image from camera.",
    close: "Close",
    contextAware: "Page context",
    dislike: "Not helpful",
    emptyPrompt:
      "Ask anything about this page, Coptic grammar, vocabulary, or translation.",
    feedbackFailed: "Could not save feedback.",
    imageAttached: "Image attached",
    imageContext: "Image OCR Context",
    imageFromCamera: "camera",
    imageFromUpload: "upload",
    inputPlaceholder: "Ask Shenute...",
    like: "Helpful",
    minimize: "Minimize",
    noTextExtracted: "No text extracted from the selected image.",
    ocrFailed: "OCR failed for the selected image.",
    ocrPending: "OCR...",
    promptResolveFailed: "Could not resolve prompt/response for this feedback.",
    provider: "Style",
    providerGemini: "Fast answer",
    providerGeminiNmt: "Fast answer (RAG + NMT)",
    providerHf: "Experimental",
    providerOpenRouter: "Reasoned answer",
    providerThoth: "Best answer",
    ragWarning: "RAG ingest warning:",
    removeImage: "Remove",
    requestFailed: "Request failed.",
    saved: "Saved.",
    savedRag: "Saved and added to RAG learning.",
    savingFeedback: "Saving feedback...",
    selectedForOcrAlt: "Selected for OCR",
    send: "Send",
    signInBody:
      "Sign in to use Shenute AI on this page, ask follow-up questions, and send OCR-backed prompts.",
    signInFeedback: "Sign in to send learning feedback signals",
    signInTitle: "Sign in required",
    submitAdminNote: "Submit admin note",
    thinking: "Thinking...",
    saveHistory: "Download transcript",
    savedHistory: "Transcript downloaded.",
    writeAdminFeedback: "Write admin feedback before submitting.",
  },
  nl: {
    addImage: "Afbeelding",
    adminNotePlaceholder:
      "Alleen admin: voeg feedback toe bij deze prompt en dit antwoord.",
    adminNoteTitle: "Leer-notitie voor beheerder",
    camera: "Camera",
    cameraAccessFailed: "Geen toegang tot de camera.",
    cameraFeedNotReady: "De camerafeed is nog niet klaar. Probeer opnieuw.",
    cameraNotReady: "De camera is nog niet klaar.",
    cameraUnsupported:
      "Camera wordt niet ondersteund op dit apparaat of in deze browser.",
    capture: "Vastleggen",
    captureFailed: "Afbeelding kon niet uit de camera worden vastgelegd.",
    close: "Sluiten",
    contextAware: "Pagina-context",
    dislike: "Niet behulpzaam",
    emptyPrompt:
      "Stel een vraag over deze pagina, Koptische grammatica, woordenschat of vertaling.",
    feedbackFailed: "Feedback kon niet worden opgeslagen.",
    imageAttached: "Afbeelding toegevoegd",
    imageContext: "OCR-context van afbeelding",
    imageFromCamera: "camera",
    imageFromUpload: "upload",
    inputPlaceholder: "Vraag Shenute...",
    like: "Behulpzaam",
    minimize: "Minimaliseren",
    noTextExtracted:
      "Er is geen tekst uit de geselecteerde afbeelding gehaald.",
    ocrFailed: "OCR is mislukt voor de geselecteerde afbeelding.",
    ocrPending: "OCR...",
    promptResolveFailed:
      "Prompt en antwoord konden niet aan deze feedback worden gekoppeld.",
    provider: "Stijl",
    providerGemini: "Snel antwoord",
    providerGeminiNmt: "Snel antwoord (RAG + NMT)",
    providerHf: "Experimenteel",
    providerOpenRouter: "Uitgewerkt antwoord",
    providerThoth: "Beste antwoord",
    ragWarning: "RAG-invoerwaarschuwing:",
    removeImage: "Verwijderen",
    requestFailed: "Verzoek mislukt.",
    saved: "Opgeslagen.",
    savedRag: "Opgeslagen en toegevoegd aan RAG-leren.",
    savingFeedback: "Feedback opslaan...",
    selectedForOcrAlt: "Geselecteerd voor OCR",
    send: "Versturen",
    signInBody:
      "Meld u aan om Shenute AI op deze pagina te gebruiken, vervolgvragen te stellen en OCR-prompts te versturen.",
    signInFeedback: "Meld u aan om leersignalen te versturen",
    signInTitle: "Aanmelden vereist",
    submitAdminNote: "Adminnotitie versturen",
    thinking: "Denkt na...",
    saveHistory: "Transcript downloaden",
    savedHistory: "Transcript gedownload.",
    writeAdminFeedback: "Schrijf adminfeedback voordat u die verstuurt.",
  },
} as const satisfies Record<Language, Record<string, string>>;

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

function formatChatHistory(
  messages: ChatMessageLike[],
  pageContext: PageContextPayload,
  provider: ShenuteProvider,
) {
  const lines: string[] = [];
  lines.push("Shenute AI chat history");
  lines.push(`Page: ${pageContext.title || pageContext.path || "unknown"}`);
  lines.push(`URL: ${pageContext.url || "unknown"}`);
  lines.push(`Provider: ${provider}`);
  lines.push(`Saved: ${new Date().toISOString()}`);
  lines.push("");

  for (const message of messages) {
    let role = "System";
    if (message.role === "user") {
      role = "User";
    } else if (message.role === "assistant") {
      role = "Assistant";
    }

    const text = getMessageText(message) || "[no text]";
    lines.push(`${role}:`);
    lines.push(text);
    lines.push("");
  }

  return lines.join("\n");
}

function toShenuteProvider(value: string): ShenuteProvider {
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

function getFeedbackStatusClass(status: "error" | "pending" | "success") {
  if (status === "error") {
    return "text-danger";
  }

  if (status === "pending") {
    return "text-muted";
  }

  return "text-coptic";
}

function buildPageContext(pathname: string): PageContextPayload {
  if (typeof window === "undefined") {
    return {
      excerpt: "",
      path: pathname,
      title: "",
      url: "",
    };
  }

  const title = document.title?.trim() ?? "";
  const url = window.location.href;

  const mainText = document.querySelector("main")?.textContent ?? "";
  const bodyText = document.body?.textContent ?? "";
  const extractedText =
    mainText.replace(/\s+/g, " ").trim().length > 0 ? mainText : bodyText;
  const excerpt = extractedText.replace(/\s+/g, " ").trim().slice(0, 3500);

  return {
    excerpt,
    path: pathname,
    title,
    url,
  };
}

function getPageContextSegments(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment === "en" || firstSegment === "nl") {
    return segments.slice(1);
  }

  return segments;
}

function formatFallbackPageContextLabel(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPageContextLabel(
  pageContext: PageContextPayload,
  language: Language,
) {
  const labels = PAGE_CONTEXT_LABELS[language];
  const [section] = getPageContextSegments(pageContext.path);

  if (!section) {
    return labels.home;
  }

  const routeLabel = labels[section];
  if (routeLabel) {
    return routeLabel;
  }

  const title = pageContext.title.replace(SITE_TITLE_SUFFIX_PATTERN, "").trim();
  return title || formatFallbackPageContextLabel(section) || pageContext.path;
}

type FloatingAiAssistantPanelProps = {
  initialOpen?: boolean;
};

export function FloatingAiAssistantPanel({
  initialOpen = false,
}: FloatingAiAssistantPanelProps) {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const copy = floatingShenuteCopy[language];
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [launcherOpacity, setLauncherOpacity] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [inferenceProvider, setInferenceProvider] =
    useState<ShenuteProvider>("thoth");
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
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
  const shenuteSessionIdRef = useRef(crypto.randomUUID());

  const { isAuthenticated, isReady } = useOptionalAuthGate();
  const [selectedReactionByMessage, setSelectedReactionByMessage] = useState<
    Record<string, ShenuteReactionSignal>
  >({});
  const [adminFeedbackDraftByMessage, setAdminFeedbackDraftByMessage] =
    useState<Record<string, string>>({});
  const [feedbackStateByMessage, setFeedbackStateByMessage] =
    useState<FeedbackStateByMessage>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const pageContext = useMemo(() => buildPageContext(pathname), [pathname]);
  const pageContextLabel = useMemo(
    () => getPageContextLabel(pageContext, language),
    [language, pageContext],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/shenute",
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const isLoading = status !== "ready";
  const isShenuteAccessBlocked = isReady && !isAuthenticated;
  const typedMessages = messages as ChatMessageLike[];
  const isAttachmentMenuDisabled =
    isLoading || ocrPending || isShenuteAccessBlocked;
  const iconButtonClassName = sharedIconButtonClassName({
    className: "h-9 w-9 shrink-0 border-line/80 bg-surface/80",
  });
  const floatingContainerClassName = cx(
    "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 sm:bottom-5 sm:right-5",
    !isOpen &&
      "opacity-[var(--floating-shenute-opacity)] transition-opacity duration-200 ease-out hover:opacity-100 focus-within:opacity-100 motion-reduce:transition-none",
  );
  const floatingContainerStyle = !isOpen
    ? ({
        "--floating-shenute-opacity": launcherOpacity.toFixed(2),
      } as CSSProperties)
    : undefined;
  let conversationContent: ReactNode;

  if (isShenuteAccessBlocked) {
    conversationContent = (
      <div className="flex h-full items-center">
        <AuthGateNotice
          align="left"
          className="w-full"
          size="comfortable"
          title={copy.signInTitle}
        >
          {copy.signInBody}
        </AuthGateNotice>
      </div>
    );
  } else if (messages.length === 0) {
    conversationContent = (
      <div className="rounded-2xl border border-dashed border-accent/20 bg-accent-soft/55 px-3 py-4 text-sm leading-6 text-muted dark:bg-accent-soft/25">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-coptic shadow-sm">
          <span className="font-coptic leading-none">Ϣ</span>
        </div>
        <p>{copy.emptyPrompt}</p>
      </div>
    );
  } else {
    conversationContent = messages.map((message, index) => {
      const assistantMessage = message as ChatMessageLike;
      const promptMessage =
        message.role === "assistant"
          ? findPreviousUserMessage(typedMessages, index)
          : null;
      const feedbackState = feedbackStateByMessage[message.id];
      const selectedReaction = selectedReactionByMessage[message.id];
      const adminDraft = adminFeedbackDraftByMessage[message.id] ?? "";
      const isFeedbackPending = feedbackState?.status === "pending";

      return (
        <article
          key={message.id}
          className={
            message.role === "user"
              ? "ml-8 rounded-2xl rounded-br-sm bg-coptic px-3.5 py-2.5 font-coptic text-[0.98rem] leading-6 text-white shadow-sm dark:text-paper"
              : "mr-5 rounded-2xl rounded-bl-sm border border-line/80 bg-surface/95 px-3.5 py-2.5 font-coptic text-[0.98rem] leading-6 text-ink shadow-sm ring-1 ring-line/60"
          }
        >
          {(() => {
            const text = getMessageText(message);
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
                      className={cx(
                        "underline underline-offset-4",
                        message.role === "user"
                          ? "decoration-white/60 hover:decoration-white"
                          : "decoration-accent/45 hover:decoration-accent",
                      )}
                    />
                  ),
                  code: ({ className, children, ...props }) => (
                    <code
                      className={cx(
                        "rounded px-1 py-0.5 text-[0.95em]",
                        message.role === "user"
                          ? "bg-white/15 text-white"
                          : "bg-elevated text-ink",
                        className,
                      )}
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

          {message.role === "assistant" ? (
            <div className="mt-2 space-y-2 border-t border-line/80 pt-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={copy.like}
                  title={copy.like}
                  onClick={() => {
                    void handleReaction(
                      "like",
                      assistantMessage,
                      promptMessage,
                    );
                  }}
                  disabled={!isAuthenticated || isFeedbackPending}
                  className={buttonClassName({
                    size: "sm",
                    variant: "secondary",
                    className: cx(
                      "h-8 gap-1.5 px-2 text-xs",
                      selectedReaction === "like" &&
                        "border-coptic/35 bg-coptic-soft text-coptic",
                    ),
                  })}
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.like}
                </button>
                <button
                  type="button"
                  aria-label={copy.dislike}
                  title={copy.dislike}
                  onClick={() => {
                    void handleReaction(
                      "dislike",
                      assistantMessage,
                      promptMessage,
                    );
                  }}
                  disabled={!isAuthenticated || isFeedbackPending}
                  className={buttonClassName({
                    size: "sm",
                    variant: "secondary",
                    className: cx(
                      "h-8 gap-1.5 px-2 text-xs",
                      selectedReaction === "dislike" &&
                        "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                    ),
                  })}
                >
                  <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.dislike}
                </button>
              </div>

              <details className="rounded-2xl border border-line/80 bg-elevated/60 p-2">
                <summary className="cursor-pointer font-semibold text-ink">
                  {copy.adminNoteTitle}
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    value={adminDraft}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAdminFeedbackDraftByMessage((current) => ({
                        ...current,
                        [message.id]: value,
                      }));
                    }}
                    placeholder={copy.adminNotePlaceholder}
                    rows={3}
                    disabled={!isAuthenticated || isFeedbackPending}
                    className="w-full rounded-xl border border-line bg-surface px-2 py-1 text-[11px] text-ink focus:border-accent/55 focus:outline-none focus:ring-2 focus:ring-accent/30"
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
                      className: "h-8 px-2 text-xs",
                    })}
                  >
                    {copy.submitAdminNote}
                  </button>
                </div>
              </details>

              {feedbackState ? (
                <p className={getFeedbackStatusClass(feedbackState.status)}>
                  {feedbackState.message}
                </p>
              ) : null}

              {!isAuthenticated && isReady ? (
                <AuthGateInlinePrompt
                  className="text-[11px]"
                  message={copy.signInFeedback}
                />
              ) : null}
            </div>
          ) : null}
        </article>
      );
    });
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

  function handleSaveChatHistory() {
    const historyText = formatChatHistory(
      typedMessages,
      pageContext,
      inferenceProvider,
    );
    const blob = new Blob([historyText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `shenute-chat-history-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    setSaveStatus(copy.savedHistory);
    window.setTimeout(() => setSaveStatus(null), 3000);
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
      setCameraError(copy.cameraUnsupported);
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
          : copy.cameraAccessFailed,
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
      setCameraError(copy.cameraFeedNotReady);
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;
    const context = canvasElement.getContext("2d");
    if (!context) {
      setCameraError(copy.captureFailed);
      return;
    }

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setCameraError(copy.captureFailed);
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

  useEffect(() => {
    if (isOpen) {
      return;
    }

    let restoreTimeout: number | undefined;
    const handleScroll = () => {
      setLauncherOpacity(LAUNCHER_SCROLLING_OPACITY);
      if (restoreTimeout !== undefined) {
        window.clearTimeout(restoreTimeout);
      }
      restoreTimeout = window.setTimeout(() => {
        setLauncherOpacity(1);
        restoreTimeout = undefined;
      }, LAUNCHER_SCROLL_IDLE_DELAY_MS);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (restoreTimeout !== undefined) {
        window.clearTimeout(restoreTimeout);
      }
    };
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isShenuteAccessBlocked) {
      return;
    }

    const trimmed = inputValue.trim();
    if ((!trimmed && !selectedImage) || isLoading || ocrPending) {
      return;
    }

    let composedPrompt = trimmed;

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
          .slice(0, 6000);

        composedPrompt = [
          composedPrompt,
          `[${copy.imageContext}]`,
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

    const freshContext = buildPageContext(pathname);

    sendMessage(
      { text: composedPrompt },
      {
        body: {
          inferenceProvider,
          pageContext: freshContext,
        },
      },
    );
    setInputValue("");
    clearSelectedImage();
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
          message: copy.signInFeedback,
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
          message: copy.promptResolveFailed,
          status: "error",
        },
      }));
      return false;
    }

    setFeedbackStateByMessage((current) => ({
      ...current,
      [options.assistantMessage.id]: {
        message: copy.savingFeedback,
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
          pageContext,
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
        throw new Error(payload.error ?? copy.feedbackFailed);
      }

      let successMessage: string = copy.saved;
      if (payload.ragIngested) {
        successMessage = copy.savedRag;
      } else if (payload.ragWarning) {
        successMessage = `${copy.saved} ${copy.ragWarning} ${payload.ragWarning}`;
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
              : copy.feedbackFailed,
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
    <div
      className={floatingContainerClassName}
      data-testid={!isOpen ? "floating-shenute-launcher" : undefined}
      style={floatingContainerStyle}
    >
      {isOpen ? (
        <section className="flex h-[560px] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-line/80 bg-surface/95 shadow-panel backdrop-blur-xl sm:w-[400px]">
          <header className="border-b border-line/80 bg-surface/90 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coptic-soft text-coptic shadow-sm">
                  <span className="font-coptic leading-none">Ϣ</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    Shenute AI
                  </p>
                  <p
                    className="truncate text-xs text-muted"
                    title={`${copy.contextAware}: ${pageContextLabel}`}
                  >
                    {copy.contextAware}: {pageContextLabel}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {saveStatus ? (
                  <span className="hidden max-w-24 truncate text-[11px] font-medium text-coptic sm:inline">
                    {saveStatus}
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label={copy.saveHistory}
                  title={copy.saveHistory}
                  onClick={handleSaveChatHistory}
                  disabled={typedMessages.length === 0}
                  className={iconButtonClassName}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={copy.minimize}
                  title={copy.minimize}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className={iconButtonClassName}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="border-b border-line/80 px-4 py-2.5">
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              <span className="shrink-0">{copy.provider}</span>
              <select
                className="compact-select-base min-h-9 flex-1 py-1 text-xs normal-case tracking-normal"
                value={inferenceProvider}
                onChange={(event) => {
                  setInferenceProvider(toShenuteProvider(event.target.value));
                }}
                disabled={isLoading || isShenuteAccessBlocked}
              >
                <option value="hf">{copy.providerHf}</option>
                <option value="gemini">{copy.providerGemini}</option>
                <option value="gemini_nmt">{copy.providerGeminiNmt}</option>
                <option value="openrouter">{copy.providerOpenRouter}</option>
                <option value="thoth">{copy.providerThoth}</option>
              </select>
            </label>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-elevated/45 p-3">
            {conversationContent}

            {isLoading ? (
              <div className="mr-8 inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-line/80 bg-surface/95 px-3 py-2 text-sm text-muted shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {copy.thinking}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-line/80 bg-surface/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl"
          >
            {error ? (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {error.message || copy.requestFailed}
              </p>
            ) : null}
            {ocrError ? (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {ocrError}
              </p>
            ) : null}
            {cameraError ? (
              <p className="mb-2 rounded-xl border border-warning/20 bg-accent-soft/75 px-3 py-2 text-xs text-accent-strong dark:text-accent">
                {cameraError}
              </p>
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
              <div className="mb-2 rounded-2xl border border-line/80 bg-elevated/65 p-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mb-2 w-full rounded-xl border border-line/80"
                />
                <canvas ref={captureCanvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void captureFromCamera();
                    }}
                    className={buttonClassName({
                      size: "sm",
                      variant: "primary",
                      className: "h-9 text-xs",
                    })}
                  >
                    <ScanText className="h-3.5 w-3.5" />
                    {copy.capture}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className: "h-9 text-xs",
                    })}
                  >
                    {copy.close}
                  </button>
                </div>
              </div>
            ) : null}

            {selectedImagePreviewUrl ? (
              <div className="mb-2 flex items-center gap-3 rounded-2xl border border-line/80 bg-elevated/65 p-2">
                <Image
                  unoptimized
                  src={selectedImagePreviewUrl}
                  alt={copy.selectedForOcrAlt}
                  width={72}
                  height={72}
                  className="h-14 w-14 shrink-0 rounded-xl border border-line/80 bg-surface object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-[11px] font-semibold text-ink">
                      {copy.imageAttached}
                    </span>
                    <Badge tone="accent" size="xs">
                      {selectedImageSource === "camera"
                        ? copy.imageFromCamera
                        : copy.imageFromUpload}
                    </Badge>
                    {ocrPending ? (
                      <Badge tone="neutral" size="xs">
                        {copy.ocrPending}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-[11px] text-muted">
                    {selectedImage?.name}
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    aria-label={copy.removeImage}
                    title={copy.removeImage}
                    onClick={clearSelectedImage}
                    className={buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className:
                        "h-8 w-8 border-rose-200 px-0 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30",
                    })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 rounded-2xl border border-line/80 bg-surface/95 p-2 shadow-soft">
              <details className="group relative shrink-0">
                <summary
                  aria-disabled={isAttachmentMenuDisabled}
                  aria-label={`${copy.addImage} / ${copy.camera}`}
                  onClick={(event) => {
                    if (isAttachmentMenuDisabled) {
                      event.preventDefault();
                    }
                  }}
                  tabIndex={isAttachmentMenuDisabled ? -1 : 0}
                  title={`${copy.addImage} / ${copy.camera}`}
                  className={cx(
                    buttonClassName({
                      size: "sm",
                      variant: "secondary",
                      className:
                        "h-10 w-10 cursor-pointer list-none rounded-xl px-0 [&::-webkit-details-marker]:hidden",
                    }),
                    isAttachmentMenuDisabled &&
                      "pointer-events-none opacity-55",
                  )}
                >
                  <ImagePlus className="h-4 w-4" />
                </summary>
                <div className="absolute bottom-full left-0 z-30 mb-2 w-52 rounded-2xl border border-line/80 bg-surface p-2 shadow-panel">
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
                    {copy.camera}
                  </button>
                </div>
              </details>
              <input
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                }}
                placeholder={copy.inputPlaceholder}
                className="min-h-10 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:outline-none focus:ring-0"
                disabled={isLoading || ocrPending || isShenuteAccessBlocked}
              />
              <button
                type="submit"
                aria-label={copy.send}
                title={copy.send}
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
                    "h-10 w-10 shrink-0 rounded-lg px-0 disabled:hover:opacity-55",
                })}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!isOpen ? (
        <button
          type="button"
          aria-label={t("shenute.launcher.open")}
          title={t("shenute.launcher.open")}
          onClick={() => {
            setIsOpen(true);
          }}
          className="inline-flex h-12 w-12 items-center justify-center gap-2 rounded-lg border border-transparent bg-ink text-paper shadow-panel transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-accent/35 dark:bg-accent-soft dark:text-ink dark:hover:bg-elevated sm:h-auto sm:w-auto sm:px-5 sm:py-3 sm:text-sm sm:font-semibold"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">
            {t("shenute.launcher.open")}
          </span>
        </button>
      ) : null}
    </div>
  );
}
