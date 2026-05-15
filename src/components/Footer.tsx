"use client";

import Link from "next/link";
import { FaXTwitter, FaInstagram, FaGithub } from "react-icons/fa6";

import { iconButtonClassName } from "@/components/Button";
import {
  getContributorsPath,
  getDevelopersPath,
  getPrivacyPath,
  getTermsPath,
} from "@/lib/locale";

import { useLanguage } from "./LanguageProvider";

export function Footer() {
  const { language, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const brandLabel = t("home.title");

  return (
    <footer className="relative z-40 mt-auto w-full border-t border-line/80 bg-paper">
      <div className="site-container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p className="text-center text-sm leading-6 text-muted md:text-left">
            &copy; {currentYear} Coptic Compass. {t("footer.rights")}
          </p>
          <p className="text-center text-sm leading-6 text-muted/80 md:text-left">
            {brandLabel} {t("footer.credit")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted/70 md:justify-start">
            <Link
              href={getPrivacyPath(language)}
              className="transition-colors hover:text-ink"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href={getTermsPath(language)}
              className="transition-colors hover:text-ink"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href={getDevelopersPath(language)}
              className="transition-colors hover:text-ink"
            >
              {t("footer.developers")}
            </Link>
            <Link
              href={getContributorsPath(language)}
              className="transition-colors hover:text-ink"
            >
              {t("footer.contributors")}
            </Link>
            <Link href="/api-docs" className="transition-colors hover:text-ink">
              {t("footer.apiDocs")}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://x.com/kyrilloswannes"
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClassName()}
            title="X (Twitter)"
          >
            <span className="sr-only">X (Twitter)</span>
            <FaXTwitter className="h-[18px] w-[18px]" />
          </a>
          <a
            href="https://www.instagram.com/kyrilloswannes/"
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClassName()}
            title="Instagram"
          >
            <span className="sr-only">Instagram</span>
            <FaInstagram className="h-[18px] w-[18px]" />
          </a>
          <a
            href="https://github.com/KyroHub"
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClassName()}
            title="GitHub"
          >
            <span className="sr-only">GitHub</span>
            <FaGithub className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
