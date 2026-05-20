import {
  DEFAULT_DICTIONARY_DIALECT_FILTER,
  type DictionaryDialectCode,
} from "@/features/dictionary/config";
import { getEntryNounGender } from "@/features/dictionary/lib/entryGrammar";
import type {
  DialectFormVariants,
  DictionaryClientEntry,
  DictionaryInflectedFormDetails,
  DictionarySenseGrammarGender,
  DictionarySenseGrammarNumber,
} from "@/features/dictionary/types";

type EntryDisplayCandidate = Pick<
  DictionaryClientEntry,
  "dialects" | "headword"
> &
  Partial<Pick<DictionaryClientEntry, "id" | "inflections" | "senses">>;
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
type InflectedFormRole = "absolute" | "nominal" | "pronominal";
type InflectedFormCollectionRole = InflectedFormRole | "default";
type ImperativeRoleForms = Partial<Record<InflectedFormRole, string>>;
export type ImperativeDisplayForm = {
  form: string;
  gender?: DictionarySenseGrammarGender;
  number?: DictionarySenseGrammarNumber;
  role: InflectedFormRole;
  uncertain?: boolean;
};
type GenderedHeadingPart = {
  entryId?: number;
  marker: GenderedHeadingMarker;
  spelling: string;
};

function getGenderedPartKey(
  part: Pick<GenderedHeadingPart, "marker" | "spelling">,
) {
  return `${part.marker}:${part.spelling}`;
}

export function hasImperativeDisplayFormMorphology(
  form: Pick<ImperativeDisplayForm, "gender" | "number">,
) {
  return Boolean(form.gender || form.number);
}

const DIALECT_VARIANT_STATE_ORDER: readonly DialectVariantState[] = [
  "absolute",
  "nominal",
  "pronominal",
  "stative",
  "constructParticiples",
] as const;
const INFLECTED_FORM_ROLE_ORDER: readonly InflectedFormRole[] = [
  "absolute",
  "nominal",
  "pronominal",
] as const;
const INFLECTED_FORM_COLLECTION_ROLE_ORDER: readonly InflectedFormCollectionRole[] =
  [...INFLECTED_FORM_ROLE_ORDER, "default"] as const;

function addUniqueForm(forms: string[], form: string) {
  const normalizedForm = form.trim();

  if (normalizedForm && !forms.includes(normalizedForm)) {
    forms.push(normalizedForm);
  }
}

function getInflectedFormText(form: string | DictionaryInflectedFormDetails) {
  return typeof form === "string" ? form : form.form;
}

function toImperativeDisplayForm(
  form: string | DictionaryInflectedFormDetails,
  role: InflectedFormRole,
): ImperativeDisplayForm {
  if (typeof form === "string") {
    return { form, role };
  }

  return {
    form: form.form,
    role,
    ...(form.gender ? { gender: form.gender } : {}),
    ...(form.number ? { number: form.number } : {}),
    ...(form.uncertain !== undefined ? { uncertain: form.uncertain } : {}),
  };
}

function addUniqueImperativeDisplayForm(
  forms: ImperativeDisplayForm[],
  form: ImperativeDisplayForm,
) {
  const normalizedForm = form.form.trim();

  if (!normalizedForm) {
    return;
  }

  if (
    forms.some(
      (existingForm) =>
        existingForm.form === normalizedForm &&
        existingForm.gender === form.gender &&
        existingForm.number === form.number &&
        existingForm.role === form.role,
    )
  ) {
    return;
  }

  forms.push({ ...form, form: normalizedForm });
}

function collectInflectionForms(
  entry: EntryDisplayCandidate,
  kind: keyof NonNullable<EntryDisplayCandidate["inflections"]>,
  options: {
    dialect?: DictionaryDialectCode;
    includeUnscoped?: boolean;
  } = {},
) {
  const collectedForms: string[] = [];
  const dialectInflections = entry.inflections?.[kind];

  if (!dialectInflections) {
    return collectedForms;
  }

  for (const [inflectionDialect, roleForms] of Object.entries(
    dialectInflections,
  )) {
    const isRequestedDialect =
      !options.dialect || inflectionDialect === options.dialect;
    const isUnscopedFallback =
      options.includeUnscoped && inflectionDialect === "default";

    if (!isRequestedDialect && !isUnscopedFallback) {
      continue;
    }

    for (const role of INFLECTED_FORM_COLLECTION_ROLE_ORDER) {
      for (const form of roleForms?.[role] ?? []) {
        addUniqueForm(collectedForms, getInflectedFormText(form));
      }

      for (const form of roleForms?.variants?.[role] ?? []) {
        addUniqueForm(collectedForms, getInflectedFormText(form));
      }
    }
  }

  return collectedForms;
}

function collectInflectionRoleForms(
  entry: EntryDisplayCandidate,
  kind: keyof NonNullable<EntryDisplayCandidate["inflections"]>,
  options: {
    dialect?: DictionaryDialectCode;
    includeUnscoped?: boolean;
  } = {},
) {
  const collectedForms: Record<InflectedFormRole, string[]> = {
    absolute: [],
    nominal: [],
    pronominal: [],
  };
  const dialectInflections = entry.inflections?.[kind];

  if (!dialectInflections) {
    return collectedForms;
  }

  for (const [inflectionDialect, roleForms] of Object.entries(
    dialectInflections,
  )) {
    const isRequestedDialect =
      !options.dialect || inflectionDialect === options.dialect;
    const isUnscopedFallback =
      options.includeUnscoped && inflectionDialect === "default";

    if (!isRequestedDialect && !isUnscopedFallback) {
      continue;
    }

    for (const role of INFLECTED_FORM_ROLE_ORDER) {
      for (const form of roleForms?.[role] ?? []) {
        addUniqueForm(collectedForms[role], getInflectedFormText(form));
      }
    }
  }

  return collectedForms;
}

function collectInflectionRoleDisplayForms(
  entry: EntryDisplayCandidate,
  kind: keyof NonNullable<EntryDisplayCandidate["inflections"]>,
  options: {
    dialect?: DictionaryDialectCode;
    includeUnscoped?: boolean;
  } = {},
) {
  const collectedForms: Record<InflectedFormRole, ImperativeDisplayForm[]> = {
    absolute: [],
    nominal: [],
    pronominal: [],
  };
  const dialectInflections = entry.inflections?.[kind];

  if (!dialectInflections) {
    return collectedForms;
  }

  for (const [inflectionDialect, roleForms] of Object.entries(
    dialectInflections,
  )) {
    const isRequestedDialect =
      !options.dialect || inflectionDialect === options.dialect;
    const isUnscopedFallback =
      options.includeUnscoped && inflectionDialect === "default";

    if (!isRequestedDialect && !isUnscopedFallback) {
      continue;
    }

    for (const role of INFLECTED_FORM_ROLE_ORDER) {
      for (const form of roleForms?.[role] ?? []) {
        addUniqueImperativeDisplayForm(
          collectedForms[role],
          toImperativeDisplayForm(form, role),
        );
      }
    }
  }

  return collectedForms;
}

function collectInflectionRoleVariantDisplayForms(
  entry: EntryDisplayCandidate,
  kind: keyof NonNullable<EntryDisplayCandidate["inflections"]>,
  options: {
    dialect?: DictionaryDialectCode;
    includeUnscoped?: boolean;
  } = {},
) {
  const collectedForms: Record<InflectedFormRole, ImperativeDisplayForm[]> = {
    absolute: [],
    nominal: [],
    pronominal: [],
  };
  const dialectInflections = entry.inflections?.[kind];

  if (!dialectInflections) {
    return collectedForms;
  }

  for (const [inflectionDialect, roleForms] of Object.entries(
    dialectInflections,
  )) {
    const isRequestedDialect =
      !options.dialect || inflectionDialect === options.dialect;
    const isUnscopedFallback =
      options.includeUnscoped && inflectionDialect === "default";

    if (!isRequestedDialect && !isUnscopedFallback) {
      continue;
    }

    for (const role of INFLECTED_FORM_ROLE_ORDER) {
      const primaryForms = (roleForms?.[role] ?? []).map((form) =>
        toImperativeDisplayForm(form, role),
      );
      const hasMorphology = primaryForms.some(
        hasImperativeDisplayFormMorphology,
      );
      const implicitVariantForms = hasMorphology
        ? primaryForms.filter(
            (form) => !hasImperativeDisplayFormMorphology(form),
          )
        : primaryForms.slice(1);

      for (const form of implicitVariantForms) {
        addUniqueImperativeDisplayForm(collectedForms[role], form);
      }

      for (const form of roleForms?.variants?.[role] ?? []) {
        addUniqueImperativeDisplayForm(
          collectedForms[role],
          toImperativeDisplayForm(form, role),
        );
      }
    }
  }

  return collectedForms;
}

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

function isImperativeRoleForms(
  forms: readonly string[] | ImperativeRoleForms,
): forms is ImperativeRoleForms {
  return !Array.isArray(forms);
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
  const primaryConstructParticiple = forms.participles?.[0] ?? "";
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
 * entry-card spelling, where stative and construct-participle data belongs in
 * the entry body instead of the compact title.
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
 * Returns structured feminine forms for one dialect.
 */
function getDialectFeminineForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
) {
  return collectInflectionForms(entry, "feminine", {
    dialect,
    includeUnscoped: options.includeUnscoped,
  });
}

/**
 * Returns structured plural forms for one dialect.
 */
export function getDialectPluralForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
) {
  return collectInflectionForms(entry, "plural", {
    dialect,
    includeUnscoped: options.includeUnscoped,
  });
}

/**
 * Returns every structured plural form in source order.
 */
export function getAllPluralForms(entry: EntryDisplayCandidate) {
  return collectInflectionForms(entry, "plural");
}

/**
 * Returns dialect-specific structured imperative forms for their dedicated
 * entry section.
 */
export function getDialectImperativeForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
) {
  return collectInflectionForms(entry, "imperative", {
    dialect,
    includeUnscoped: options.includeUnscoped,
  });
}

export function getDialectPrimaryImperativeForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
): ImperativeRoleForms {
  const roleForms = collectInflectionRoleForms(entry, "imperative", {
    dialect,
    includeUnscoped: options.includeUnscoped,
  });
  const primaryForms: ImperativeRoleForms = {};

  for (const role of INFLECTED_FORM_ROLE_ORDER) {
    const primaryForm = roleForms[role][0];

    if (primaryForm) {
      primaryForms[role] = primaryForm;
    }
  }

  return primaryForms;
}

export function getDialectPrimaryImperativeDisplayForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
) {
  const roleForms = collectInflectionRoleDisplayForms(entry, "imperative", {
    dialect,
    includeUnscoped: options.includeUnscoped,
  });

  return INFLECTED_FORM_ROLE_ORDER.flatMap((role) => {
    const forms = roleForms[role];

    if (forms.length === 0) {
      return [];
    }

    const hasMorphology = forms.some(hasImperativeDisplayFormMorphology);

    return hasMorphology
      ? forms.filter(hasImperativeDisplayFormMorphology)
      : [forms[0]];
  });
}

export function getDialectImperativeVariantForms(
  entry: EntryDisplayCandidate,
  dialect: DictionaryDialectCode,
  options: { includeUnscoped?: boolean } = {},
) {
  const roleForms = collectInflectionRoleVariantDisplayForms(
    entry,
    "imperative",
    {
      dialect,
      includeUnscoped: options.includeUnscoped,
    },
  );

  return INFLECTED_FORM_ROLE_ORDER.flatMap((role) =>
    roleForms[role].map((form) => form.form),
  );
}

/**
 * Joins imperative forms using the same compact absolute + bound-form notation
 * used by dictionary entry headers when the imperative has a canonical triplet.
 */
export function formatImperativeForms(
  forms: readonly string[] | ImperativeRoleForms,
) {
  if (isImperativeRoleForms(forms)) {
    return [
      forms.absolute ?? "",
      formatBoundForms(forms.nominal, forms.pronominal),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

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
 * Builds the compact base + feminine + plural heading sequence for masculine
 * nouns with structured feminine forms.
 */
export function getGenderedHeadingParts(
  entry: EntryDisplayCandidate,
  selectedDialect: EntryDialectSelection = DEFAULT_DICTIONARY_DIALECT_FILTER,
): GenderedHeadingPart[] {
  if (getEntryNounGender(entry) !== "M") {
    return [];
  }

  const hasFeminineForms = Boolean(entry.inflections?.["feminine"]);

  if (!hasFeminineForms) {
    return [];
  }

  const usedGenderedPartKeys = new Set<string>();
  const usedSpellings = new Set<string>();
  const baseSpelling = getPreferredEntryPrincipalSpelling(
    entry,
    selectedDialect,
  ).trim();
  const headingParts: GenderedHeadingPart[] = [];

  if (baseSpelling) {
    const basePart = {
      entryId: entry.id,
      marker: "m",
      spelling: baseSpelling,
    } satisfies GenderedHeadingPart;

    headingParts.push(basePart);
    usedGenderedPartKeys.add(getGenderedPartKey(basePart));
    usedSpellings.add(baseSpelling);
  }

  const primaryDialectKey = getPreferredEntryDialectKey(entry, selectedDialect);
  const feminineCandidates = primaryDialectKey
    ? getDialectFeminineForms(entry, primaryDialectKey, {
        includeUnscoped: true,
      })
    : [];
  const feminineSpelling = feminineCandidates.find((feminineForm) => {
    if (!feminineForm) {
      return false;
    }

    return !usedGenderedPartKeys.has(
      getGenderedPartKey({ marker: "f", spelling: feminineForm }),
    );
  });

  if (feminineSpelling) {
    const femininePart = {
      marker: "f",
      spelling: feminineSpelling,
    } satisfies GenderedHeadingPart;

    headingParts.push(femininePart);
    usedGenderedPartKeys.add(getGenderedPartKey(femininePart));
    usedSpellings.add(feminineSpelling);
  }

  const pluralCandidates = primaryDialectKey
    ? getDialectPluralForms(entry, primaryDialectKey, {
        includeUnscoped: true,
      })
    : getAllPluralForms(entry);
  const pluralSpelling = pluralCandidates.find(
    (pluralForm) => pluralForm && !usedSpellings.has(pluralForm),
  );

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
  dialect: DictionaryDialectCode,
): GenderedHeadingPart[] {
  if (getEntryNounGender(entry) !== "M") {
    return [];
  }

  const hasDialectFeminineForms = Boolean(
    entry.inflections?.["feminine"]?.[dialect],
  );

  if (!hasDialectFeminineForms) {
    return [];
  }

  const forms = entry.dialects[dialect];
  if (!forms) {
    return [];
  }

  const usedGenderedPartKeys = new Set<string>();
  const usedSpellings = new Set<string>();
  const baseSpelling = formatPrincipalDialectForms(
    forms,
    entry.headword,
  ).trim();
  const parts: GenderedHeadingPart[] = [];

  if (baseSpelling) {
    const basePart = {
      entryId: entry.id,
      marker: "m",
      spelling: baseSpelling,
    } satisfies GenderedHeadingPart;

    parts.push(basePart);
    usedGenderedPartKeys.add(getGenderedPartKey(basePart));
    usedSpellings.add(baseSpelling);
  }

  const feminineSpelling = getDialectFeminineForms(entry, dialect).find(
    (feminineForm) => {
      if (!feminineForm) {
        return false;
      }

      return !usedGenderedPartKeys.has(
        getGenderedPartKey({ marker: "f", spelling: feminineForm }),
      );
    },
  );

  if (feminineSpelling) {
    const femininePart = {
      marker: "f",
      spelling: feminineSpelling,
    } satisfies GenderedHeadingPart;

    parts.push(femininePart);
    usedGenderedPartKeys.add(getGenderedPartKey(femininePart));
    usedSpellings.add(feminineSpelling);
  }

  const pluralSpelling = getDialectPluralForms(entry, dialect).find(
    (pluralForm) => pluralForm && !usedSpellings.has(pluralForm),
  );

  if (pluralSpelling) {
    parts.push({
      marker: "pl",
      spelling: pluralSpelling,
    });
  }

  return parts;
}
