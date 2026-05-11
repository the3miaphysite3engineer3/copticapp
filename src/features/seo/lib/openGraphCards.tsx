import { siteConfig } from "@/lib/site";

import type { ReactNode } from "react";

type OpenGraphStat = {
  label: string;
  value: string;
};

type OpenGraphThemeName = "mixed" | "sky" | "emerald" | "stone";

type OpenGraphGlossMarker = "f" | "m" | "pl";

type OpenGraphHeadingPart = {
  marker: OpenGraphGlossMarker;
  spelling: string;
};

type OpenGraphGenderedGlossRow = {
  values: Array<{
    marker: OpenGraphGlossMarker;
    meaning: string;
  }>;
};

type EntryCardOptions = {
  footerLabel: string;
  genderedGlossRows?: OpenGraphGenderedGlossRow[];
  gloss: string;
  heading: string;
  headingParts?: OpenGraphHeadingPart[];
  partOfSpeech: string;
  partOfSpeechLabel: string;
  relatedForms: string[];
  relatedLabel: string;
  strapline: string;
};

type LessonCardOptions = {
  eyebrow: string;
  footerLabel: string;
  lessonLabel: string;
  summary: string;
  stats: OpenGraphStat[];
  title: string;
};

type PublicationCardOptions = {
  eyebrow: string;
  footerLabel: string;
  languageLabel: string;
  statusLabel: string;
  subtitle?: string;
  summary: string;
  title: string;
};

type SiteCardOptions = {
  descriptor: string;
  eyebrow: string;
  footerLabel: string;
  stats: OpenGraphStat[];
  summary: string;
  title: string;
};

const siteDomain = new URL(siteConfig.liveUrl).host;

const CARD_THEMES: Record<
  OpenGraphThemeName,
  {
    background: string;
    overlay: string;
    mutedPillBackground: string;
    panelBackground: string;
    panelBorder: string;
    primaryPillBackground: string;
    primaryPillText: string;
    secondaryPillBackground: string;
    secondaryPillText: string;
    textBody: string;
    textFooter: string;
    textMuted: string;
    textPrimary: string;
  }
> = {
  mixed: {
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eff6ff 44%, #ecfdf5 100%)",
    overlay:
      "radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(5, 150, 105, 0.16), transparent 28%)",
    mutedPillBackground: "rgba(15, 23, 42, 0.08)",
    panelBackground: "rgba(255, 255, 255, 0.78)",
    panelBorder: "1px solid rgba(148, 163, 184, 0.26)",
    primaryPillBackground: "rgba(15, 118, 110, 0.12)",
    primaryPillText: "#0f766e",
    secondaryPillBackground: "rgba(15, 23, 42, 0.08)",
    secondaryPillText: "#334155",
    textBody: "#334155",
    textFooter: "#475569",
    textMuted: "#0f766e",
    textPrimary: "#0f172a",
  },
  sky: {
    background:
      "linear-gradient(135deg, #f8fafc 0%, #ecfeff 40%, #dbeafe 100%)",
    overlay:
      "radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 34%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.16), transparent 30%)",
    mutedPillBackground: "rgba(15, 23, 42, 0.08)",
    panelBackground: "rgba(255, 255, 255, 0.72)",
    panelBorder: "1px solid rgba(148, 163, 184, 0.35)",
    primaryPillBackground: "rgba(14, 116, 144, 0.12)",
    primaryPillText: "#0f766e",
    secondaryPillBackground: "rgba(15, 23, 42, 0.08)",
    secondaryPillText: "#334155",
    textBody: "#334155",
    textFooter: "#475569",
    textMuted: "#0f766e",
    textPrimary: "#0f172a",
  },
  emerald: {
    background:
      "linear-gradient(135deg, #f8fafc 0%, #ecfdf5 42%, #dcfce7 100%)",
    overlay:
      "radial-gradient(circle at top right, rgba(5, 150, 105, 0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.14), transparent 28%)",
    mutedPillBackground: "rgba(15, 23, 42, 0.08)",
    panelBackground: "rgba(255, 255, 255, 0.76)",
    panelBorder: "1px solid rgba(148, 163, 184, 0.26)",
    primaryPillBackground: "rgba(5, 150, 105, 0.12)",
    primaryPillText: "#047857",
    secondaryPillBackground: "rgba(15, 23, 42, 0.08)",
    secondaryPillText: "#334155",
    textBody: "#334155",
    textFooter: "#475569",
    textMuted: "#047857",
    textPrimary: "#0f172a",
  },
  stone: {
    background:
      "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 42%, #ecfccb 100%)",
    overlay:
      "radial-gradient(circle at top right, rgba(132, 204, 22, 0.12), transparent 34%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.12), transparent 28%)",
    mutedPillBackground: "rgba(15, 23, 42, 0.08)",
    panelBackground: "rgba(255, 255, 255, 0.8)",
    panelBorder: "1px solid rgba(168, 162, 158, 0.25)",
    primaryPillBackground: "rgba(132, 204, 22, 0.14)",
    primaryPillText: "#3f6212",
    secondaryPillBackground: "rgba(15, 23, 42, 0.08)",
    secondaryPillText: "#44403c",
    textBody: "#44403c",
    textFooter: "#57534e",
    textMuted: "#3f6212",
    textPrimary: "#1c1917",
  },
};

function OpenGraphCardFrame({
  children,
  themeName,
}: {
  children: ReactNode;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: theme.background,
        color: theme.textPrimary,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.overlay,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "68px 72px",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OpenGraphPill({
  label,
  themeName,
  tone = "primary",
}: {
  label: string;
  themeName: OpenGraphThemeName;
  tone?: "primary" | "secondary";
}) {
  const theme = CARD_THEMES[themeName];
  const isPrimary = tone === "primary";

  return (
    <div
      style={{
        display: "flex",
        padding: "10px 18px",
        borderRadius: 999,
        background: isPrimary
          ? theme.primaryPillBackground
          : theme.secondaryPillBackground,
        fontSize: 24,
        letterSpacing: isPrimary ? 1.3 : 0.2,
        textTransform: isPrimary ? "uppercase" : "none",
        color: isPrimary ? theme.primaryPillText : theme.secondaryPillText,
      }}
    >
      {label}
    </div>
  );
}

function OpenGraphLinguisticGloss({
  marginLeft = 0,
  marginRight = 0,
  marker,
  size,
}: {
  marginLeft?: number;
  marginRight?: number;
  marker: OpenGraphGlossMarker;
  size: "body" | "heading";
}) {
  const displayMarker = marker.toLocaleUpperCase();

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        alignSelf: "center",
        color: CARD_THEMES.sky.textFooter,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: size === "heading" ? 30 : 22,
        fontVariant: "small-caps",
        fontWeight: 700,
        letterSpacing: 0,
        lineHeight: 1,
        marginLeft,
        marginRight,
        whiteSpace: "nowrap",
      }}
    >
      {displayMarker}
    </span>
  );
}

function OpenGraphEntryHeading({
  heading,
  headingParts = [],
}: {
  heading: string;
  headingParts?: OpenGraphHeadingPart[];
}) {
  const sharedHeadingStyle = {
    display: "flex",
    fontSize: 70,
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: 0,
    fontFamily: "Antinoou",
  } as const;

  if (headingParts.length === 0) {
    return <div style={sharedHeadingStyle}>{heading}</div>;
  }

  return (
    <div
      style={{
        ...sharedHeadingStyle,
        alignItems: "baseline",
        flexWrap: "wrap",
      }}
    >
      {headingParts.map((part) => (
        <span
          key={`${part.spelling}-${part.marker}`}
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 6,
            marginRight: 18,
          }}
        >
          <span>{part.spelling}</span>
          <OpenGraphLinguisticGloss
            marginLeft={10}
            marker={part.marker}
            size="heading"
          />
        </span>
      ))}
    </div>
  );
}

function OpenGraphEntryGloss({
  genderedGlossRows = [],
  gloss,
}: {
  genderedGlossRows?: OpenGraphGenderedGlossRow[];
  gloss: string;
}) {
  const sharedGlossStyle = {
    display: "flex",
    fontSize: 34,
    lineHeight: 1.25,
    color: CARD_THEMES.sky.textBody,
    maxWidth: 920,
  } as const;

  if (genderedGlossRows.length === 0) {
    return <div style={sharedGlossStyle}>{gloss}</div>;
  }

  return (
    <div
      style={{
        ...sharedGlossStyle,
        flexDirection: "column",
        gap: 6,
      }}
    >
      {genderedGlossRows.map((row, rowIndex) => (
        <div
          key={`gendered-gloss-${rowIndex}`}
          style={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          {row.values.map((value, valueIndex) => (
            <span
              key={`${value.marker}-${value.meaning}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                marginRight: valueIndex < row.values.length - 1 ? 12 : 0,
              }}
            >
              <OpenGraphLinguisticGloss
                marginRight={7}
                marker={value.marker}
                size="body"
              />
              <span>
                {value.meaning}
                {valueIndex < row.values.length - 1 ? ";" : ""}
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function OpenGraphBanner({
  label,
  themeName,
}: {
  label: string;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        padding: "16px 28px",
        borderRadius: 28,
        background: theme.primaryPillBackground,
        border: theme.panelBorder,
        fontSize: 28,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: theme.primaryPillText,
      }}
    >
      {label}
    </div>
  );
}

function OpenGraphStatGrid({
  compact = false,
  stats,
  themeName,
}: {
  compact?: boolean;
  stats: OpenGraphStat[];
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 14 : 18,
        width: "100%",
      }}
    >
      {stats.map((stat) => (
        <div
          key={`${stat.label}-${stat.value}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: compact ? 8 : 10,
            minWidth: 0,
            flex: 1,
            padding: compact ? "16px 18px" : "20px 22px",
            borderRadius: compact ? 20 : 24,
            background: theme.panelBackground,
            border: theme.panelBorder,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: compact ? 18 : 20,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              color: theme.textMuted,
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: compact ? 32 : 36,
              lineHeight: 1.1,
              fontWeight: 700,
              color: theme.textPrimary,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpenGraphFooter({
  left,
  right,
  themeName,
}: {
  left: string;
  right: string;
  themeName: OpenGraphThemeName;
}) {
  const theme = CARD_THEMES[themeName];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        width: "100%",
        fontSize: 22,
        color: theme.textFooter,
      }}
    >
      <div style={{ display: "flex" }}>{left}</div>
      <div style={{ display: "flex" }}>{right}</div>
    </div>
  );
}

/**
 * Renders the generic site overview Open Graph card used for the homepage and
 * as the fallback preview when a specific resource cannot be resolved.
 */
export function renderSiteOpenGraphCard({
  descriptor,
  eyebrow,
  footerLabel,
  stats,
  summary,
  title,
}: SiteCardOptions) {
  return (
    <OpenGraphCardFrame themeName="mixed">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          maxWidth: 900,
          width: "100%",
        }}
      >
        <OpenGraphBanner label={eyebrow} themeName="mixed" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 82,
              lineHeight: 0.98,
              fontWeight: 700,
              letterSpacing: -2.4,
              color: CARD_THEMES.mixed.textPrimary,
              marginTop: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.2,
              color: CARD_THEMES.mixed.textBody,
              maxWidth: 920,
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {descriptor}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: CARD_THEMES.mixed.textBody,
              maxWidth: 920,
              marginTop: 4,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          paddingBottom: 12,
        }}
      >
        <OpenGraphStatGrid compact stats={stats} themeName="mixed" />
        <div
          style={{
            display: "flex",
            paddingBottom: 28,
          }}
        >
          <OpenGraphFooter
            left={siteDomain}
            right={footerLabel}
            themeName="mixed"
          />
        </div>
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the dictionary-entry Open Graph card with gloss, part-of-speech, and
 * related-form callouts.
 */
export function renderEntryOpenGraphCard({
  footerLabel,
  genderedGlossRows = [],
  gloss,
  heading,
  headingParts = [],
  partOfSpeech,
  partOfSpeechLabel,
  relatedForms,
  relatedLabel,
  strapline,
}: EntryCardOptions) {
  return (
    <OpenGraphCardFrame themeName="sky">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 960,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <OpenGraphPill label={strapline} themeName="sky" />
          <OpenGraphPill
            label={`${partOfSpeechLabel}: ${partOfSpeech}`}
            themeName="sky"
            tone="secondary"
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <OpenGraphEntryHeading
            heading={heading}
            headingParts={headingParts}
          />
          <OpenGraphEntryGloss
            genderedGlossRows={genderedGlossRows}
            gloss={gloss}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {relatedForms.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: CARD_THEMES.sky.textMuted,
              }}
            >
              {relatedLabel}
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              {relatedForms.map((form) => (
                <div
                  key={form}
                  style={{
                    display: "flex",
                    padding: "12px 18px",
                    borderRadius: 18,
                    background: CARD_THEMES.sky.panelBackground,
                    border: CARD_THEMES.sky.panelBorder,
                    fontSize: 28,
                    color: CARD_THEMES.sky.textPrimary,
                    fontFamily: "Antinoou",
                  }}
                >
                  {form}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="sky"
        />
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the grammar-lesson Open Graph card with lesson metadata and summary
 * statistics.
 */
export function renderLessonOpenGraphCard({
  eyebrow,
  footerLabel,
  lessonLabel,
  summary,
  stats,
  title,
}: LessonCardOptions) {
  return (
    <OpenGraphCardFrame themeName="emerald">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 940,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <OpenGraphPill label={eyebrow} themeName="emerald" />
          <OpenGraphPill
            label={lessonLabel}
            themeName="emerald"
            tone="secondary"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 66,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: -1.8,
              color: CARD_THEMES.emerald.textPrimary,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.3,
              color: CARD_THEMES.emerald.textBody,
              maxWidth: 920,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <OpenGraphStatGrid stats={stats} themeName="emerald" />
        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="emerald"
        />
      </div>
    </OpenGraphCardFrame>
  );
}

/**
 * Renders the publication Open Graph card with status, language, subtitle, and
 * summary metadata.
 */
export function renderPublicationOpenGraphCard({
  eyebrow,
  footerLabel,
  languageLabel,
  statusLabel,
  subtitle,
  summary,
  title,
}: PublicationCardOptions) {
  return (
    <OpenGraphCardFrame themeName="stone">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <OpenGraphPill label={eyebrow} themeName="stone" />
          <OpenGraphPill
            label={statusLabel}
            themeName="stone"
            tone="secondary"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 60,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -1.6,
              color: CARD_THEMES.stone.textPrimary,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.3,
                color: CARD_THEMES.stone.textBody,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: CARD_THEMES.stone.textBody,
              maxWidth: 920,
            }}
          >
            {summary}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <OpenGraphPill label={languageLabel} themeName="stone" />
        </div>
        <OpenGraphFooter
          left={siteDomain}
          right={footerLabel}
          themeName="stone"
        />
      </div>
    </OpenGraphCardFrame>
  );
}
