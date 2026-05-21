"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ComponentType } from "react";

import { controlButtonClassName } from "@/components/Button";
import { cx } from "@/lib/classes";
import {
  getContactPath,
  getDashboardPath,
  getDictionaryPath,
  getGrammarPath,
  getLocalizedHomePath,
  getPublicationsPath,
  getShenutePath,
} from "@/lib/locale";
import { getLoginPath } from "@/lib/supabase/config";

import { useLanguage } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import {
  getNavbarLinkClasses,
  type NavbarLinkVariant,
} from "./navbarLinkStyles";
import { ThemeToggle } from "./ThemeToggle";

type NavbarAuthLinkProps = {
  dashboardHref: string;
  dashboardLabel: string;
  loginHref: string;
  loginLabel: string;
  onNavigate?: () => void;
  pathname: string;
  variant: NavbarLinkVariant;
};

type NavbarAuthLinkComponent = ComponentType<NavbarAuthLinkProps>;

function LazyNavbarAuthLink(props: NavbarAuthLinkProps) {
  const [AuthLink, setAuthLink] = useState<NavbarAuthLinkComponent | null>(
    null,
  );
  const hrefPathname = props.loginHref.split("?")[0] ?? props.loginHref;
  const isActive =
    props.pathname === hrefPathname ||
    props.pathname.startsWith(`${hrefPathname}/`);
  const { labelClassName, linkClassName } = getNavbarLinkClasses({
    isActive,
    variant: props.variant,
  });

  const loadAuthLink = useCallback(() => {
    if (AuthLink) {
      return;
    }

    void import("./NavbarAuthLink").then((module) => {
      setAuthLink(() => module.NavbarAuthLink);
    });
  }, [AuthLink]);

  if (AuthLink) {
    return <AuthLink {...props} />;
  }

  return (
    <Link
      href={props.loginHref}
      prefetch={false}
      onClick={props.onNavigate}
      onFocus={loadAuthLink}
      onMouseEnter={loadAuthLink}
      data-label={props.loginLabel}
      className={linkClassName}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={labelClassName}>{props.loginLabel}</span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname() ?? "";
  const { language, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboardHref = getDashboardPath(language);
  const loginHref = getLoginPath(dashboardHref);
  const brandLabel = t("home.title");

  const links = [
    { href: getPublicationsPath(language), label: t("nav.publications") },
    { href: getDictionaryPath(language), label: t("nav.dictionary") },
    { href: getGrammarPath(language), label: t("nav.grammar") },
    { href: getShenutePath(), label: t("nav.shenute") },
    { href: getContactPath(language), label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-paper/86 shadow-sm backdrop-blur-md transition-colors duration-300">
      <div className="site-container">
        <div className="flex min-h-[4.75rem] items-center justify-between gap-4 py-3">
          <Link
            href={getLocalizedHomePath(language)}
            prefetch={false}
            className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:gap-3"
          >
            <div className="relative h-[52px] w-[52px] shrink-0 lg:h-14 lg:w-14">
              <Image
                src="/logo/Coptic_Compass_Primary.svg"
                alt={`${brandLabel} logo`}
                fill
                sizes="(max-width: 1024px) 52px, 56px"
                loading="eager"
                className="object-contain dark:hidden"
              />
              <Image
                src="/logo/Coptic_Compass_Secondary.svg"
                alt={`${brandLabel} logo`}
                fill
                sizes="(max-width: 1024px) 52px, 56px"
                loading="eager"
                className="hidden object-contain dark:block"
              />
            </div>
            <span className="hidden min-w-0 whitespace-nowrap font-coptic text-2xl font-normal leading-none tracking-normal text-ink transition-colors lg:inline">
              {brandLabel}
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              const { labelClassName, linkClassName } = getNavbarLinkClasses({
                isActive,
                variant: "desktop",
              });
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  data-label={link.label}
                  className={linkClassName}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={labelClassName}>{link.label}</span>
                </Link>
              );
            })}
            <LazyNavbarAuthLink
              dashboardHref={dashboardHref}
              dashboardLabel={t("nav.dashboard")}
              loginHref={loginHref}
              loginLabel={t("nav.login") || "Sign In"}
              pathname={pathname}
              variant="desktop"
            />
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button
              type="button"
              className={controlButtonClassName({
                className: cx(
                  "lg:hidden",
                  isMobileMenuOpen &&
                    "border-accent/30 bg-accent-soft text-accent-strong dark:bg-accent-soft/35 dark:text-accent",
                ),
              })}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-controls="mobile-navigation"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile"
            className="mb-3 flex flex-col gap-1 rounded-lg border border-line bg-surface/88 p-2 shadow-soft backdrop-blur-md lg:hidden"
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              const { labelClassName, linkClassName } = getNavbarLinkClasses({
                isActive,
                variant: "mobile",
              });
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-label={link.label}
                  className={linkClassName}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={labelClassName}>{link.label}</span>
                </Link>
              );
            })}
            <LazyNavbarAuthLink
              dashboardHref={dashboardHref}
              dashboardLabel={t("nav.dashboard")}
              loginHref={loginHref}
              loginLabel={t("nav.login") || "Sign In"}
              onNavigate={() => setIsMobileMenuOpen(false)}
              pathname={pathname}
              variant="mobile"
            />
          </nav>
        )}
      </div>
    </header>
  );
}
