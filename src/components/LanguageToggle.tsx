"use client";

import { controlButtonClassName } from "@/components/Button";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const targetLanguageLabel =
    language === "en" ? t("lang.switchToDutch") : t("lang.switchToEnglish");

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "nl" : "en")}
      className={controlButtonClassName({
        className: "min-w-[3rem] px-3 text-xs font-semibold tracking-[0.08em]",
      })}
      aria-label={targetLanguageLabel}
      title={targetLanguageLabel}
    >
      {language.toUpperCase()}
    </button>
  );
}
