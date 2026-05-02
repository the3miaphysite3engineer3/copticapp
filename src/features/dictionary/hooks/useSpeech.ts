import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { getPremiumAudio } from "@/actions/tts";
import { useTtsSettings } from "@/features/dictionary/hooks/useTtsSettings";
import { bohairicToPhonetic } from "@/features/dictionary/lib/bohairicPhonetics";
import {
  COPTIC_CHAR_SET,
  copticToIPA,
  VOICES,
} from "@/features/dictionary/lib/copticTts";

type ActiveSpeechListener = (speechId: string | null) => void;

let activeSpeechId: string | null = null;
const activeSpeechListeners = new Set<ActiveSpeechListener>();

function publishActiveSpeechId(speechId: string | null) {
  activeSpeechId = speechId;
  activeSpeechListeners.forEach((listener) => listener(speechId));
}

function clearActiveSpeechId(speechId: string) {
  if (activeSpeechId === speechId) {
    publishActiveSpeechId(null);
  }
}

function isSpeechSynthesisSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function subscribeToSpeechSupport() {
  return () => {};
}

interface UseSpeechReturn {
  speak: (copticText: string) => void;
  speakPremium: (copticText: string) => Promise<void>;
  speakAuto: (copticText: string) => void;
  speakMixed: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  isPremiumLoading: boolean;
}

/**
 * Exposes a shared Web Speech controller for Bohairic dictionary
 * pronunciations.
 */
export function useSpeech(): UseSpeechReturn {
  const speechId = useId();
  const [activeId, setActiveId] = useState<string | null>(activeSpeechId);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [premiumAudio, setPremiumAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const { settings } = useTtsSettings();

  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    isSpeechSynthesisSupported,
    () => false,
  );

  useEffect(() => {
    const handleActiveSpeechChange = (nextSpeechId: string | null) => {
      setActiveId(nextSpeechId);
    };

    activeSpeechListeners.add(handleActiveSpeechChange);
    handleActiveSpeechChange(activeSpeechId);

    return () => {
      activeSpeechListeners.delete(handleActiveSpeechChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (activeSpeechId === speechId && isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
        clearActiveSpeechId(speechId);
      }
    };
  }, [speechId]);

  const speak = useCallback(
    (copticText: string) => {
      if (!isSpeechSynthesisSupported() || !copticText.trim()) {
        return;
      }

      try {
        const phonetic = bohairicToPhonetic(copticText);
        if (!phonetic) {
          return;
        }

        const utterance = new window.SpeechSynthesisUtterance(phonetic);

        utterance.lang = "en-US";
        utterance.rate = 0.85;
        utterance.pitch = 1.0;

        utterance.onstart = () => publishActiveSpeechId(speechId);
        utterance.onend = () => clearActiveSpeechId(speechId);
        utterance.onerror = () => clearActiveSpeechId(speechId);

        publishActiveSpeechId(null);
        window.speechSynthesis.cancel();
        publishActiveSpeechId(speechId);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn("[useSpeech] Speech synthesis failed:", error);
        clearActiveSpeechId(speechId);
      }
    },
    [speechId],
  );

  const speakPremium = useCallback(
    async (copticText: string) => {
      if (!copticText.trim()) {
        return;
      }

      try {
        setIsPremiumLoading(true);
        publishActiveSpeechId(null);
        window.speechSynthesis.cancel();
        if (premiumAudio) {
          premiumAudio.pause();
          setPremiumAudio(null);
        }

        const voice = VOICES[settings.voice];
        const ipa = copticToIPA(copticText, voice.pronunciation);
        const { base64Audio, mimeType } = await getPremiumAudio(ipa, voice.id);

        const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
        setPremiumAudio(audio);

        audio.onplay = () => publishActiveSpeechId(speechId);
        audio.onended = () => {
          clearActiveSpeechId(speechId);
          setPremiumAudio(null);
        };
        audio.onerror = () => {
          clearActiveSpeechId(speechId);
          setPremiumAudio(null);
        };

        await audio.play();
      } catch (error) {
        console.warn("[useSpeech] Premium speech synthesis failed:", error);
        clearActiveSpeechId(speechId);
        throw error;
      } finally {
        setIsPremiumLoading(false);
      }
    },
    [speechId, premiumAudio, settings.voice],
  );

  const speakAuto = useCallback(
    (copticText: string) => {
      if (settings.mode === "premium") {
        speakPremium(copticText).catch(() => {
          // Fallback to standard if premium fails
          speak(copticText);
        });
      } else {
        speak(copticText);
      }
    },
    [settings.mode, speakPremium, speak],
  );

  const stripMarkdown = (text: string) => {
    return text
      .replace(/[#*`_~]/g, "") // Basic formatting characters
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links: [text](url) -> text
      .replace(/^>\s*/gm, "") // Blockquotes
      .replace(/^[\s-*+]+(?=\S)/gm, "") // List bullets
      .trim();
  };

  const speakMixed = useCallback(
    async (rawText: string) => {
      if (!rawText.trim()) {
        return;
      }

      const text = stripMarkdown(rawText);

      // Create an AbortController for this playback session
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Group Coptic words together with their connecting whitespace and punctuation
      const copticRegex = new RegExp(
        `[${COPTIC_CHAR_SET}]+(?:[\\s\\.,;:\\-\\?]+[${COPTIC_CHAR_SET}]+)*`,
        "g",
      );
      const tokens: { type: "coptic" | "other"; text: string }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = copticRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({
            type: "other",
            text: text.slice(lastIndex, match.index),
          });
        }
        tokens.push({ type: "coptic", text: match[0] });
        lastIndex = copticRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        tokens.push({ type: "other", text: text.slice(lastIndex) });
      }

      try {
        publishActiveSpeechId(null);
        window.speechSynthesis.cancel();
        if (premiumAudio) {
          premiumAudio.pause();
          setPremiumAudio(null);
        }

        publishActiveSpeechId(speechId);

        for (const token of tokens) {
          if (controller.signal.aborted) {
            break;
          }

          if (token.type === "coptic") {
            const voice = VOICES[settings.voice];
            const ipa = copticToIPA(token.text, voice.pronunciation);
            const { base64Audio, mimeType } = await getPremiumAudio(
              ipa,
              voice.id,
            );

            if (controller.signal.aborted) {
              break;
            }

            await new Promise<void>((resolve, reject) => {
              const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
              setPremiumAudio(audio);

              const onAborted = () => {
                audio.pause();
                setPremiumAudio(null);
                reject(new Error("Aborted"));
              };
              controller.signal.addEventListener("abort", onAborted);

              audio.onended = () => {
                setPremiumAudio(null);
                controller.signal.removeEventListener("abort", onAborted);
                resolve();
              };
              audio.onerror = () => {
                setPremiumAudio(null);
                controller.signal.removeEventListener("abort", onAborted);
                reject(new Error("Premium audio playback failed"));
              };
              audio.play().catch((err) => {
                controller.signal.removeEventListener("abort", onAborted);
                reject(err);
              });
            });
          } else {
            if (!isSpeechSynthesisSupported()) {
              continue;
            }
            await new Promise<void>((resolve, reject) => {
              const utterance = new window.SpeechSynthesisUtterance(token.text);
              utterance.lang = "en-US";
              utterance.rate = 0.9;

              const onAborted = () => {
                window.speechSynthesis.cancel();
                reject(new Error("Aborted"));
              };
              controller.signal.addEventListener("abort", onAborted);

              utterance.onend = () => {
                controller.signal.removeEventListener("abort", onAborted);
                resolve();
              };
              utterance.onerror = (e) => {
                controller.signal.removeEventListener("abort", onAborted);
                reject(e);
              };
              window.speechSynthesis.speak(utterance);
            });
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Aborted") {
          // Normal exit
        } else {
          console.warn("[useSpeech] Mixed speech synthesis failed:", error);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        clearActiveSpeechId(speechId);
      }
    },
    [speechId, premiumAudio, settings.voice],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    if (premiumAudio) {
      premiumAudio.pause();
      setPremiumAudio(null);
    }
    clearActiveSpeechId(speechId);
  }, [speechId, premiumAudio]);

  return {
    speak,
    speakPremium,
    speakAuto,
    speakMixed,
    stop,
    isSpeaking: activeId === speechId,
    isSupported,
    isPremiumLoading,
  };
}
