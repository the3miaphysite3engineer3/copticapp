"use client";

import Link from "next/link";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PageShell, pageShellAccents } from "@/components/PageShell";
import { SurfacePanel } from "@/components/SurfacePanel";
import { getGrammarPath, getLocalizedHomePath } from "@/lib/locale";

const code = `const response = await fetch(
  "https://www.copticcompass.com/api/v1/grammar/lessons",
);

const payload = await response.json();
const lessonTitles = payload.data.map((lesson) => lesson.title.en);`;

const dictionaryCode = `const response = await fetch(
  "https://www.copticcompass.com/api/v1/dictionary/search?q=ⲙⲟⲓ&dialect=B&limit=10",
);

const page = await response.json();
const firstEntry = page.entries[0];`;

const shenuteCode = `const response = await fetch("https://www.copticcompass.com/api/shenute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    inferenceProvider: "thoth",
    messages: [
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "Translate this Coptic sentence." }],
      },
    ],
  }),
});

const streamOrText = await response.text();`;

const ocrCode = `# .env.local
OCR_SERVICE_URL=https://your-ocr-service/upload
# Optional for strict OCR backends:
OCR_UPLOAD_FIELD=file

curl -X POST "https://www.copticcompass.com/api/ocr?lang=cop" \\
  -F "file=@/path/to/coptic-image.jpg"

# Proxy OCR flow
# 1) client POSTs to /api/ocr
# 2) server forwards to OCR_SERVICE_URL
# 3) upstream OCR response is returned to the client`;

export function DevelopersPageClient() {
  const { t, language } = useLanguage();

  const endpoints = [
    {
      href: "/api/v1/grammar",
      label: "/api/v1/grammar",
      description: t("developers.endpoints.grammar.desc"),
    },
    {
      href: "/api/v1/grammar/lessons?status=published",
      label: "/api/v1/grammar/lessons?status=published",
      description: t("developers.endpoints.lessons.desc"),
    },
    {
      href: "/api/v1/grammar/manifest",
      label: "/api/v1/grammar/manifest",
      description: t("developers.endpoints.manifest.desc"),
    },
    {
      href: "/api/openapi.json",
      label: "/api/openapi.json",
      description: t("developers.endpoints.openapi.desc"),
    },
    {
      href: "/api/v1/dictionary/search?q=ⲙⲟⲓ&dialect=B",
      label: "/api/v1/dictionary/search",
      description: t("developers.endpoints.dictionarySearch.desc"),
    },
    {
      href: "/api/v1/dictionary/search-index",
      label: "/api/v1/dictionary/search-index",
      description: t("developers.endpoints.dictionaryIndex.desc"),
    },
    {
      href: "/api/shenute",
      label: "/api/shenute",
      description: t("developers.endpoints.shenute.desc"),
    },
    {
      href: "/api/ocr",
      label: "/api/ocr",
      description: t("developers.endpoints.ocr.desc"),
    },
  ];

  const resources = [
    {
      href: "/api-docs",
      label: t("developers.resources.swagger.label"),
      description: t("developers.resources.swagger.desc"),
    },
    {
      href: "/api/openapi.json",
      label: t("developers.resources.openapi.label"),
      description: t("developers.resources.openapi.desc"),
    },
    {
      href: "/api/v1/grammar",
      label: t("developers.resources.apiIndex.label"),
      description: t("developers.resources.apiIndex.desc"),
    },
    {
      href: "/api/v1/dictionary/search?q=ⲙⲟⲓ",
      label: t("developers.resources.dictionary.label"),
      description: t("developers.resources.dictionary.desc"),
    },
    {
      href: getGrammarPath(language),
      label: t("developers.resources.grammarHub.label"),
      description: t("developers.resources.grammarHub.desc"),
    },
    {
      href: "/shenute",
      label: t("developers.resources.shenute.label"),
      description: t("developers.resources.shenute.desc"),
    },
    {
      href: "/api/ocr",
      label: t("developers.resources.ocr.label"),
      description: t("developers.resources.ocr.desc"),
    },
  ];

  const workflowItems = [
    t("developers.workflow.0"),
    t("developers.workflow.1"),
    t("developers.workflow.2"),
    t("developers.workflow.3"),
    t("developers.workflow.4"),
    t("developers.workflow.5"),
    t("developers.workflow.6"),
  ];

  const integrationItems = [
    t("developers.integration.0"),
    t("developers.integration.1"),
    t("developers.integration.2"),
    t("developers.integration.3"),
    t("developers.integration.4"),
    t("developers.integration.5"),
    t("developers.integration.6"),
    t("developers.integration.7"),
    t("developers.integration.8"),
    t("developers.integration.9"),
  ];

  return (
    <PageShell
      className="app-page-shell"
      contentClassName="app-page-stack"
      width="standard"
      accents={[
        pageShellAccents.heroSkyArc,
        pageShellAccents.topRightEmeraldOrbInset,
      ]}
    >
      <BreadcrumbTrail
        items={[
          {
            label: t("nav.home"),
            href: getLocalizedHomePath(language),
          },
          { label: t("developers.breadcrumbLabel") },
        ]}
      />

      <PageHeader
        title={t("developers.heroTitle")}
        description={t("developers.heroDescription")}
        tone="sky"
        size="workspace"
      />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            {t("developers.discoveryTitle")}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 dark:text-stone-300">
            {t("developers.discoveryDescription")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/api-docs" className="btn-secondary">
              {t("developers.primaryCta")}
            </Link>
            <Link href="/api/openapi.json" className="btn-secondary">
              {t("developers.secondaryCta")}
            </Link>
            <Link href="/api/v1/grammar" className="btn-secondary">
              /api/v1/grammar
            </Link>
            <Link href="/api/v1/dictionary/search" className="btn-secondary">
              /api/v1/dictionary/search
            </Link>
          </div>
        </SurfacePanel>

        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.workflowTitle")}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {workflowItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-3 dark:border-stone-800/80 dark:bg-stone-950/50"
              >
                {item}
              </li>
            ))}
          </ul>
        </SurfacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                {t("developers.endpointsTitle")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {t("developers.title")}
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {endpoints.map((endpoint) => (
              <Link
                key={endpoint.href}
                href={endpoint.href}
                className="rounded-2xl border border-stone-200/80 bg-stone-50/80 px-5 py-4 transition-colors hover:border-sky-200 hover:bg-sky-50/70 dark:border-stone-800/80 dark:bg-stone-950/50 dark:hover:border-sky-900/70 dark:hover:bg-sky-950/20"
              >
                <p className="font-mono text-sm text-sky-700 dark:text-sky-300">
                  {endpoint.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-300">
                  {endpoint.description}
                </p>
              </Link>
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.integrationTitle")}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {integrationItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-3 dark:border-stone-800/80 dark:bg-stone-950/50"
              >
                {item}
              </li>
            ))}
          </ul>
        </SurfacePanel>
      </section>

      <section className="grid gap-6">
        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.exampleTitle")}
          </p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {t("developers.exampleCaption")}
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{code}</code>
          </pre>
        </SurfacePanel>

        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.dictionaryExampleTitle")}
          </p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {t("developers.dictionaryExampleCaption")}
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{dictionaryCode}</code>
          </pre>
        </SurfacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.resourcesTitle")}
          </p>
          <div className="mt-4 space-y-3">
            {resources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="block rounded-2xl border border-stone-200/80 bg-stone-50/80 px-4 py-4 transition-colors hover:border-sky-200 hover:bg-sky-50/70 dark:border-stone-800/80 dark:bg-stone-950/50 dark:hover:border-sky-900/70 dark:hover:bg-sky-950/20"
              >
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {resource.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-300">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </SurfacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.shenuteExampleTitle")}
          </p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {t("developers.shenuteExampleCaption")}
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{shenuteCode}</code>
          </pre>
        </SurfacePanel>

        <SurfacePanel rounded="3xl" variant="elevated" className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            {t("developers.ocrExampleTitle")}
          </p>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
            {t("developers.ocrExampleCaption")}
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-stone-200/80 bg-stone-950 px-4 py-4 text-sm leading-6 text-stone-100 dark:border-stone-800/80">
            <code>{ocrCode}</code>
          </pre>
        </SurfacePanel>
      </section>
    </PageShell>
  );
}
