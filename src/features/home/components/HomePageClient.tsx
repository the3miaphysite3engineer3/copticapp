"use client";

import {
  ArrowRight,
  Bot,
  Braces,
  Compass,
  GraduationCap,
  LibraryBig,
  Search,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type IconType } from "react-icons";
import { FaAppStoreIos, FaGooglePlay } from "react-icons/fa6";

import { buttonClassName } from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import { cx } from "@/lib/classes";
import {
  getDevelopersPath,
  getDictionaryPath,
  getGrammarPath,
  getPublicationsPath,
  getShenutePath,
} from "@/lib/locale";

type Tone = "coptic" | "gold" | "ink" | "surface";

type ProductCardProps = {
  cta: string;
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
  tone: Tone;
};

type IconTileProps = {
  icon: LucideIcon;
  tone: Tone;
};

const TONE_CLASSES: Record<
  Tone,
  {
    borderClassName: string;
    iconClassName: string;
    linkClassName: string;
  }
> = {
  coptic: {
    borderClassName: "hover:border-coptic/35",
    iconClassName: "bg-coptic-soft text-coptic",
    linkClassName: "text-coptic",
  },
  gold: {
    borderClassName: "hover:border-accent/45",
    iconClassName: "bg-accent-soft text-accent-strong dark:text-ink",
    linkClassName: "text-accent-strong dark:text-ink",
  },
  ink: {
    borderClassName: "hover:border-ink/25 dark:hover:border-paper/25",
    iconClassName: "bg-elevated text-ink",
    linkClassName: "text-ink",
  },
  surface: {
    borderClassName: "hover:border-line",
    iconClassName: "bg-surface text-muted",
    linkClassName: "text-ink",
  },
};

const productCardClassName = surfacePanelClassName({
  rounded: "lg",
  interactive: true,
  className:
    "group flex h-full min-h-[260px] flex-col overflow-hidden p-7 text-left md:p-8",
});

function IconTile({ icon: Icon, tone }: IconTileProps) {
  return (
    <span
      className={cx(
        "inline-flex h-12 w-12 items-center justify-center rounded-lg",
        TONE_CLASSES[tone].iconClassName,
      )}
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

function ProductCard({
  cta,
  description,
  href,
  icon,
  title,
  tone,
}: ProductCardProps) {
  const theme = TONE_CLASSES[tone];

  return (
    <Link
      href={href}
      prefetch={false}
      className={cx(productCardClassName, theme.borderClassName)}
    >
      <IconTile icon={icon} tone={tone} />

      <div className="mt-6 flex w-full flex-1 flex-col justify-between">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          <p className="leading-7 text-muted">{description}</p>
        </div>

        <span
          className={cx(
            "mt-8 inline-flex items-center gap-2 text-sm font-semibold",
            theme.linkClassName,
          )}
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function StoreBadge({ icon: Icon, label }: { icon: IconType; label: string }) {
  const { t } = useLanguage();

  return (
    <span
      aria-label={`${t("home.app.releasePrefix")}: ${label}`}
      className="inline-flex min-h-14 min-w-44 cursor-not-allowed items-center gap-3 rounded-lg border border-paper/15 bg-paper/95 px-4 py-2 text-left text-ink shadow-sm opacity-90 transition-opacity hover:opacity-100 dark:border-line dark:bg-paper/90"
      title={t("home.comingSoon")}
    >
      <Icon aria-hidden="true" className="h-7 w-7 shrink-0" />
      <span className="grid leading-none">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {t("home.app.releasePrefix")}
        </span>
        <span className="mt-1 text-lg font-semibold tracking-tight">
          {label}
        </span>
      </span>
    </span>
  );
}

export default function HomePageClient() {
  const { language, t } = useLanguage();
  const dictionaryHref = getDictionaryPath(language);
  const grammarHref = getGrammarPath(language);
  const publicationsHref = getPublicationsPath(language);
  const shenuteHref = getShenutePath();
  const developersHref = getDevelopersPath(language);

  const productCards: ProductCardProps[] = [
    {
      href: dictionaryHref,
      icon: Search,
      title: t("home.copticDict"),
      description: t("home.copticDict.desc"),
      cta: t("home.dictionary.cta"),
      tone: "coptic",
    },
    {
      href: grammarHref,
      icon: GraduationCap,
      title: t("grammar.title"),
      description: t("grammar.subtitle"),
      cta: t("home.grammar.cta"),
      tone: "ink",
    },
    {
      href: publicationsHref,
      icon: LibraryBig,
      title: t("home.publications"),
      description: t("home.publications.desc"),
      cta: t("home.publications.cta"),
      tone: "gold",
    },
    {
      href: shenuteHref,
      icon: Bot,
      title: t("home.shenute.title"),
      description: t("home.shenute.desc"),
      cta: t("home.shenute.cta"),
      tone: "coptic",
    },
    {
      href: developersHref,
      icon: Braces,
      title: t("home.developers.title"),
      description: t("home.developers.desc"),
      cta: t("home.developers.cta"),
      tone: "surface",
    },
  ];

  return (
    <PageShell
      className="min-h-screen px-6 pb-8 pt-2 md:pb-10"
      contentClassName="mx-auto w-full max-w-6xl space-y-14 text-center md:space-y-16"
      accents={[
        pageShellAccents.heroGoldBand,
        pageShellAccents.topRightCopticWashInset,
      ]}
    >
      <section className="mx-auto flex max-w-4xl flex-col items-center">
        <div className="relative mb-2 h-52 w-52 transition-transform duration-500 hover:scale-[1.03] md:h-64 md:w-64 lg:h-72 lg:w-72">
          <Image
            src="/logo/Coptic_Compass_Primary.svg"
            alt="Coptic Compass Logo"
            fill
            sizes="(max-width: 768px) 208px, (max-width: 1024px) 256px, 288px"
            className="object-contain dark:hidden"
            priority
            loading="eager"
          />
          <Image
            src="/logo/Coptic_Compass_Secondary.svg"
            alt="Coptic Compass Logo"
            fill
            sizes="(max-width: 768px) 208px, (max-width: 1024px) 256px, 288px"
            className="hidden object-contain dark:block"
            priority
            loading="eager"
          />
        </div>

        <PageHeader
          eyebrow={t("home.eyebrow")}
          eyebrowVariant="badge"
          title={
            <span className="font-coptic font-normal tracking-normal">
              {t("home.title")}
            </span>
          }
          description={t("home.subtitle")}
          size="hero"
          tone="brand"
        />

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={dictionaryHref}
            prefetch={false}
            className={buttonClassName({ size: "lg", variant: "primary" })}
          >
            {t("home.hero.primaryCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={grammarHref}
            prefetch={false}
            className={buttonClassName({ size: "lg", variant: "secondary" })}
          >
            {t("home.hero.secondaryCta")}
          </Link>
          <Link
            href="#mission"
            className={buttonClassName({
              className:
                "border border-accent/25 bg-accent-soft/70 text-accent-strong shadow-sm hover:border-accent/45 hover:bg-accent-soft dark:border-line dark:bg-surface/88 dark:text-ink dark:hover:border-accent/40 dark:hover:bg-elevated",
              size: "lg",
              variant: "secondary",
            })}
          >
            {t("home.hero.tertiaryCta")}
          </Link>
        </div>
      </section>

      <section
        id="mission"
        className="scroll-mt-28 grid gap-6 text-left lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch"
      >
        <div className="rounded-lg border border-line bg-ink p-8 text-paper shadow-panel dark:bg-surface/88 dark:text-ink md:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            {t("home.mission.eyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-paper dark:text-ink md:text-4xl">
            {t("home.mission.title")}
          </h2>
          <p className="mt-5 text-lg leading-8 text-paper/70 dark:text-muted">
            {t("home.mission.body")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface/88 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong dark:text-accent">
              {t("home.promise.title")}
            </p>
            <p className="mt-4 leading-7 text-muted">
              {t("home.promise.body")}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface/88 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-coptic">
              {t("home.audience.title")}
            </p>
            <p className="mt-4 leading-7 text-muted">
              {t("home.audience.body")}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong dark:text-accent">
            {t("home.platform.eyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {t("home.platform.title")}
          </h2>
          <p className="text-lg leading-8 text-muted">
            {t("home.platform.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {productCards.map((card) => (
            <ProductCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 overflow-hidden rounded-lg border border-gold/25 bg-ink p-8 text-paper shadow-panel dark:bg-surface/88 dark:text-ink md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10">
        <div className="text-center md:text-left">
          <span className="mb-4 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
            {t("home.comingSoon")}
          </span>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-paper dark:text-ink md:text-4xl">
            {t("home.app.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-paper/70 dark:text-muted md:mx-0">
            {t("home.app.desc")}
          </p>
        </div>

        <div className="space-y-5">
          <div className="border-y border-paper/10 py-5 text-left dark:border-line">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              {t("home.app.focus")}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-paper/70 dark:text-muted">
              <li>{t("home.app.focusItem1")}</li>
              <li>{t("home.app.focusItem2")}</li>
              <li>{t("home.app.focusItem3")}</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <StoreBadge
              icon={FaAppStoreIos}
              label={t("home.app.appStoreLabel")}
            />
            <StoreBadge
              icon={FaGooglePlay}
              label={t("home.app.googlePlayLabel")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface/88 p-8 text-left shadow-soft md:p-10">
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent-strong dark:text-accent">
              <Compass className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong dark:text-accent">
              {t("home.closing.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {t("home.closing.title")}
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-muted">
              {t("home.closing.body")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={publicationsHref}
                prefetch={false}
                className={buttonClassName({
                  size: "md",
                  variant: "secondary",
                })}
              >
                {t("home.publications.cta")}
              </Link>
              <Link
                href={developersHref}
                prefetch={false}
                className={buttonClassName({
                  size: "md",
                  variant: "secondary",
                })}
              >
                {t("home.developers.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
