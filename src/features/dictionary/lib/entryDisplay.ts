import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import type {
  DialectFormVariants,
  DictionaryClientEntry,
  DictionaryGenderedCounterpart,
} from "@/features/dictionary/types";

type EntryDisplayCandidate = Pick<
  DictionaryClientEntry,
  "dialects" | "headword"
> &
  Partial<Pick<DictionaryClientEntry, "gender" | "id" | "pluralForms">>;
type DialectEntryTuple = [
  DictionaryDialectCode,
  NonNullable<EntryDisplayCandidate["dialects"][DictionaryDialectCode]>,
];
type EntryDialectSelection = "ALL" | DictionaryDialectCode;
type DialectVariantState = keyof DialectFormVariants;
type DialectVariantRow = {
  forms: string[];
  state: DialectVariantState;
};
export type GenderedHeadingMarker = "f" | "m" | "pl";
type GenderedHeadingPart = {
  entryId?: string;
  marker: GenderedHeadingMarker;
  spelling: string;
};

const DIALECT_VARIANT_STATE_ORDER: readonly DialectVariantState[] = [
  "absolute",
  "nominal",
  "pronominal",
  "stative",
  "constructParticiples",
] as const;

function formatBoundForms(nominal = "", pronominal = "") {
  if (!nominal) {
    return pronominal;
  }

  if (!pronominal) {
    return nominal;
  }

  const nominalStem = nominal.endsWith("-") ? nominal.slice(0, -1) : "";
  const pronominalStem = pronominal.endsWith("=")
    ? pronominal.slice(0, -1)
    : "";

  if (nominalStem && nominalStem === pronominalStem) {
    return `${nominalStem}-/=`;
  }

  return `${nominal}/${pronominal}`;
}

/**
 * Joins the available dialect forms into the compact display string used across
 * search results and entry headers. Variants stay out of this string so the
 * displayed form remains the standard student-facing spelling.
 */
export function formatDialectForms(
  forms: DialectEntryTuple[1],
  headwordFallback: string,
) {
  const parts: string[] = [];
  const primaryConstructParticiple = forms.constructParticiples?.[0] ?? "";
  const hasDerivedForm = Boolean(
    forms.nominal ||
    forms.pronominal ||
    forms.stative ||
    primaryConstructParticiple,
  );
  let absoluteWithVariants = "";

  if (forms.absolute) {
    absoluteWithVariants = forms.absolute;
  } else if (!hasDerivedForm) {
    absoluteWithVariants = headwordFallback;
  }

  if (absoluteWithVariants) {
    parts.push(absoluteWithVariants);
  }

  const bound = formatBoundForms(forms.nominal, forms.pronominal);

  if (bound) {
    parts.push(bound);
  }
  if (forms.stative) {
    parts.push(forms.stative);
  }
  if (primaryConstructParticiple) {
    parts.push(primaryConstructParticiple);
  }

  return parts.join(" ").trim();
}

/**
 * Joins only the principal absolute and bound forms. This is the compact
 * relation-card spelling, where stative and construct-participle data belongs
 * in the entry body instead of the linked-entry title.
 */
export function formatPrincipalDialectForms(
  forms: DialectEntryTuple[1],
  headwordFallback: string,
) {
  const parts: string[] = [];
  const hasBoundForm = Boolean(forms.nominal || forms.pronominal);

  if (forms.absolute) {
    parts.push(forms.absolute);
  } else if (!hasBoundForm) {
    parts.push(headwordFallback);
  }

  const bound = formatBoundForms(forms.nominal, forms.pronominal);

  if (bound) {
    parts.push(bound);
  }

  return parts.join(" ").trim();
}

/**
 * Returns dialect-specific variants in a stable grammatical-state order for
 * the dedicated variants section.
 */
export function getDialectVariantRows(
  forms: DialectEntryTuple[1] | undefined,
): DialectVariantRow[] {
  if (!forms) {
    return [];
  }

  return DIALECT_VARIANT_STATE_ORDER.flatMap((state) => {
    const stateForms = (forms.variants?.[state] ?? []).filter(Boolean);

    return stateForms.length > 0 ? [{ state, forms: stateForms }] : [];
  });
}

/**
 * Returns dialect-specific imperative forms for their dedicated entry section.
 */
export function getDialectImperativeForms(
  forms: DialectEntryTuple[1] | undefined,
) {
  return (forms?.imperatives ?? []).filter(Boolean);
}

/**
 * Joins imperative forms using the same compact absolute + bound-form notation
 * used by dictionary entry headers when the imperative has a canonical triplet.
 */
export function formatImperativeForms(forms: readonly string[]) {
  const visibleForms = forms.filter(Boolean);
  const [absolute, nominal, pronominal] = visibleForms;

  if (
    visibleForms.length === 3 &&
    absolute &&
    nominal?.endsWith("-") &&
    pronominal?.endsWith("=")
  ) {
    return `${absolute} ${formatBoundForms(nominal, pronominal)}`;
  }

  return visibleForms.join(", ");
}

/**
 * Picks the primary dialect to display for an entry, honoring the selected
 * filter when that dialect is present and otherwise falling back to Sahidic or
 * the first available dialect.
 */
export function getPreferredEntryDialectKey(
  entry: EntryDisplayCandidate,
  selectedDialect: EntryDialectSelection = DEFAULT_DICTIONARY_DIALECT_FILTER,
) {
  const dialectKeys = Object.keys(entry.dialects) as DictionaryDialectCode[];
  let primaryDialectKey: DictionaryDialectCode | undefined = "S";

  if (selectedDialect !== "ALL" && entry.dialects[selectedDialect]) {
    primaryDialectKey = selectedDialect;
  } else if (!entry.dialects.S) {
    primaryDialectKey = dialectKeys[0];
  }

  return primaryDialectKey;
}

/**
 * Resolves the human-readable spelling shown for an entry under the active
 * dialect filter.
 */
export function getPreferredEntryDisplaySpelling(
  entry: EntryDisplayCandidate,
  selectedDialect: EntryDialectSelection = DEFAULT_DICTIONARY_DIALECT_FILTER,
) {
  const primaryDialectKey = getPreferredEntryDialectKey(entry, selectedDialect);
  const primaryForms = primaryDialectKey
    ? entry.dialects[primaryDialectKey]
    : undefined;

  if (!primaryForms) {
    return entry.headword;
  }

  return formatDialectForms(primaryForms, entry.headword);
}

/**
 * Resolves the compact absolute + bound-form spelling used for base and
 * related entry cards.
 */
export function getPreferredEntryPrincipalSpelling(
  entry: EntryDisplayCandidate,
  selectedDialect: EntryDialectSelection = DEFAULT_DICTIONARY_DIALECT_FILTER,
) {
  const primaryDialectKey = getPreferredEntryDialectKey(entry, selectedDialect);
  const primaryForms = primaryDialectKey
    ? entry.dialects[primaryDialectKey]
    : undefined;

  if (!primaryForms) {
    return entry.headword;
  }

  return formatPrincipalDialectForms(primaryForms, entry.headword);
}

/**
 * Builds the compact base + feminine counterpart + plural heading sequence for
 * masculine nouns whose feminine counterpart is stored as a related entry.
 */
export function getGenderedHeadingParts(
  entry: EntryDisplayCandidate,
  genderedCounterparts: readonly DictionaryGenderedCounterpart[] = [],
  selectedDialect: EntryDialectSelection = DEFAULT_DICTIONARY_DIALECT_FILTER,
): GenderedHeadingPart[] {
  if (entry.gender !== "M") {
    return [];
  }

  const feminineCounterparts = genderedCounterparts.filter(
    (counterpart) =>
      counterpart.relationType === "feminine-counterpart" &&
      counterpart.gender === "F",
  );

  if (feminineCounterparts.length === 0) {
    return [];
  }

  const usedSpellings = new Set<string>();
  const baseSpelling = getPreferredEntryPrincipalSpelling(
    entry,
    selectedDialect,
  ).trim();
  const headingParts: GenderedHeadingPart[] = [];

  if (baseSpelling) {
    headingParts.push({
      entryId: entry.id,
      marker: "m",
      spelling: baseSpelling,
    });
    usedSpellings.add(baseSpelling);
  }

  for (const counterpart of feminineCounterparts) {
    const counterpartSpelling = getPreferredEntryPrincipalSpelling(
      counterpart,
      selectedDialect,
    ).trim();

    if (!counterpartSpelling || usedSpellings.has(counterpartSpelling)) {
      continue;
    }

    headingParts.push({
      entryId: counterpart.id,
      marker: "f",
      spelling: counterpartSpelling,
    });
    usedSpellings.add(counterpartSpelling);
  }

  const primaryDialectKey = getPreferredEntryDialectKey(entry, selectedDialect);
  const pluralSpelling = (
    (primaryDialectKey ? entry.pluralForms?.[primaryDialectKey] : []) ?? []
  )
    .map((pluralForm) => pluralForm.trim())
    .find((pluralForm) => pluralForm && !usedSpellings.has(pluralForm));

  if (pluralSpelling) {
    headingParts.push({
      marker: "pl",
      spelling: pluralSpelling,
    });
  }

  return headingParts;
}

/**
 * Formats a gendered heading into the same compact plain-text sequence used by
 * metadata, share text, and generated Open Graph cards.
 */
export function formatGenderedHeadingParts(
  parts: readonly GenderedHeadingPart[],
) {
  return parts
    .map((part) => `${part.spelling} ${part.marker}`)
    .join(" ")
    .trim();
}

/**
 * Builds the same m/f/pl sequence as the heading, scoped to one exact dialect
 * row so alternate dialect cards do not silently borrow forms from another
 * dialect.
 */
export function getGenderedDialectFormParts(
  entry: EntryDisplayCandidate,
  genderedCounterparts: readonly DictionaryGenderedCounterpart[] = [],
  dialect: DictionaryDialectCode,
): GenderedHeadingPart[] {
  if (entry.gender !== "M") {
    return [];
  }

  const feminineCounterparts = genderedCounterparts.filter(
    (counterpart) =>
      counterpart.relationType === "feminine-counterpart" &&
      counterpart.gender === "F",
  );

  if (feminineCounterparts.length === 0) {
    return [];
  }

  const forms = entry.dialects[dialect];
  if (!forms) {
    return [];
  }

  const usedSpellings = new Set<string>();
  const baseSpelling = formatPrincipalDialectForms(
    forms,
    entry.headword,
  ).trim();
  const parts: GenderedHeadingPart[] = [];

  if (baseSpelling) {
    parts.push({
      entryId: entry.id,
      marker: "m",
      spelling: baseSpelling,
    });
    usedSpellings.add(baseSpelling);
  }

  for (const counterpart of feminineCounterparts) {
    const counterpartForms = counterpart.dialects[dialect];
    if (!counterpartForms) {
      continue;
    }

    const counterpartSpelling = formatPrincipalDialectForms(
      counterpartForms,
      counterpart.headword,
    ).trim();

    if (!counterpartSpelling || usedSpellings.has(counterpartSpelling)) {
      continue;
    }

    parts.push({
      entryId: counterpart.id,
      marker: "f",
      spelling: counterpartSpelling,
    });
    usedSpellings.add(counterpartSpelling);
  }

  const pluralSpelling = (entry.pluralForms?.[dialect] ?? [])
    .map((pluralForm) => pluralForm.trim())
    .find((pluralForm) => pluralForm && !usedSpellings.has(pluralForm));

  if (pluralSpelling) {
    parts.push({
      marker: "pl",
      spelling: pluralSpelling,
    });
  }

  return parts;
}
