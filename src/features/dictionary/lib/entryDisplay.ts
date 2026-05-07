import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import type {
  DialectFormVariants,
  DictionaryClientEntry,
} from "@/features/dictionary/types";

type DialectEntryTuple = [
  DictionaryDialectCode,
  NonNullable<DictionaryClientEntry["dialects"][DictionaryDialectCode]>,
];
type EntryDialectSelection = "ALL" | DictionaryDialectCode;
type DialectVariantState = keyof DialectFormVariants;
type DialectVariantRow = {
  forms: string[];
  state: DialectVariantState;
};

const DIALECT_VARIANT_STATE_ORDER: readonly DialectVariantState[] = [
  "absolute",
  "nominal",
  "pronominal",
  "stative",
  "constructParticiples",
] as const;

function formatBoundForms(nominal: string, pronominal: string) {
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
  entry: DictionaryClientEntry,
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
  entry: DictionaryClientEntry,
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
  entry: DictionaryClientEntry,
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
