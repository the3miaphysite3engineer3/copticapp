/**
 * copticTts.ts
 * Converts Coptic Unicode text → IPA
 * Ported from the coptic-tts script.
 */

// ═══════════════════════════════════════════════════════════════════════
// § 1  CHARACTER MAPS
// ═══════════════════════════════════════════════════════════════════════

const VOWELS: Record<string, string> = {
  "\u2c81": "Alfa", // ⲁ
  "\u2c89": "Ei", // ⲉ
  "\u2c8f": "Ita", // ⲏ
  "\u2c93": "Yota", // ⲓ
  "\u2c9f": "Omicron", // ⲟ
  "\u2cb1": "Omega", // ⲱ
};

const CONSONANTS: Record<string, string> = {
  "\u2c83": "Vita", // ⲃ
  "\u2c85": "Gamma", // ⲅ
  "\u2c87": "Delta", // ⲇ
  "\u2c8d": "Zita", // ⲍ
  "\u2c91": "Thita", // ⲑ
  "\u2c95": "Kapa", // ⲕ
  "\u2c97": "Lola", // ⲗ
  "\u2c99": "Mey", // ⲙ
  "\u2c9b": "Ney", // ⲛ
  "\u2c9d": "Exi", // ⲝ
  "\u2ca1": "Pi", // ⲡ
  "\u2ca3": "Ro", // ⲣ
  "\u2ca5": "Ceema", // ⲥ
  "\u2ca7": "Tav", // ⲧ
  "\u2ca9": "Upsilon", // ⲩ
  "\u2cab": "Fi", // ⲫ
  "\u2cad": "Ki", // ⲭ
  "\u2caf": "Epsi", // ⲯ
  "\u03e3": "Shai", // ϣ
  "\u03e5": "Fai", // ϥ
  "\u03e7": "Khai", // ϧ
  "\u03e9": "Hoori", // ϩ
  "\u03eb": "Janja", // ϫ
  "\u03ed": "Cheema", // ϭ
  "\u03ef": "Ti", // ϯ
};

const JINKIM: Record<string, string> = {
  "\u0300": "JinkimStart", // combining grave accent ̀
  "\u0307": "JinkimMiddle", // combining dot above  ̇
};

const CHAR_MAP: Record<string, string> = {
  ...VOWELS,
  ...CONSONANTS,
  ...JINKIM,
};

// ═══════════════════════════════════════════════════════════════════════
// § 2  ENUMS
// ═══════════════════════════════════════════════════════════════════════

enum Etymology {
  Egyptian = 0,
  Greek = 1,
}
export enum Pronunciation {
  Shenutean = 0,
  Cyrillic = 1,
}

// ═══════════════════════════════════════════════════════════════════════
// § 3  REGEX FACTORIES
// ═══════════════════════════════════════════════════════════════════════

const vowelKeys = Object.keys(VOWELS);
const consKeys = Object.keys(CONSONANTS);
const jinkKeys = Object.keys(JINKIM);

// ─── Regex factories ─────────────────────────────────────────────────

/** Matches any Coptic vowel character. */
const matchVowel = () => new RegExp(vowelKeys.join("|"), "i");

/** Matches a trailing consonant at the end of a string. */
const matchTrailingConsonant = () => new RegExp(`${consKeys.join("|")}$`, "i");

/** Matches a consonant–vowel–consonant cluster, excluding specific vowels. */
const matchConsonantVowelCluster = (excludes: string[]) => {
  const cons = `(${consKeys.join("|")})`;
  const vow = vowelKeys.filter((v) => !excludes.includes(v)).join("|");
  return new RegExp(`${cons}(${vow})${cons}{0,2}$`, "i");
};

/** Matches any jinkim diacritical mark. */
const matchJinkim = () => new RegExp(jinkKeys.join("|"), "i");

/** Matches front vowels: ⲉ, ⲏ, ⲓ, ⲩ. */
const matchFrontVowel = () =>
  new RegExp(["\u2c89", "\u2c8f", "\u2c93", "\u2ca9"].join("|"), "i");

/** Matches open vowels: ⲁ, ⲱ. */
const matchOpenVowel = () => new RegExp(["\u2c81", "\u2cb1"].join("|"), "i");

/** Matches any Coptic consonant character. */
const matchConsonant = () => new RegExp(consKeys.join("|"), "i");

/** Matches velar consonants: ⲅ, ⲕ, ⲝ, ⲭ. */
const matchVelar = () =>
  new RegExp(["\u2c85", "\u2c95", "\u2c9d", "\u2cad"].join("|"), "i");

// ─── Tokeniser ───────────────────────────────────────────────────────

const SPACER_RE = /\s|\.|\r|\n|:/;
export const COPTIC_CHAR_SET = Object.keys(CHAR_MAP).join("");
const COPTIC_RE = new RegExp(`[${COPTIC_CHAR_SET}]+`, "i");
const OTHER_RE = new RegExp(`[^${COPTIC_CHAR_SET}]+`, "i");
const TOKEN_RE = new RegExp(
  `(?<word>${COPTIC_RE.source})|(?<spacer>${OTHER_RE.source})+`,
  "ig",
);

// ═══════════════════════════════════════════════════════════════════════
// § 4  JINKIM RULES
// ═══════════════════════════════════════════════════════════════════════

/** Cyrillic jinkim IPA rule — renders jinkim as a stress marker ‖. */
const CYRILLIC_JINKIM = {
  default: "\u2016\u2016",
  afterAndBefore: [
    {
      after: new RegExp("\u2c81$", "i"),
      before: new RegExp("\u2c93", "i"),
      evaluator: () => "",
    },
  ],
  after: [
    [matchConsonant(), () => "\u2016e"],
    [new RegExp("\u2c93", "i"), () => ""],
  ] as [RegExp, () => string][],
};

/** Shenutean jinkim IPA rule — renders jinkim as a glottal stop ʔ. */
const SHENUTEAN_JINKIM = {
  default: "\u0294",
  afterAndBefore: [
    {
      after: new RegExp("\u2c81$", "i"),
      before: new RegExp("\u2c93", "i"),
      evaluator: () => "",
    },
  ],
  after: [
    [matchConsonant(), () => "\u0294e"],
    [new RegExp("\u2c93", "i"), () => ""],
  ] as [RegExp, () => string][],
};

// ═══════════════════════════════════════════════════════════════════════
// § 5  IPA ACCENT RULE SETS
// ═══════════════════════════════════════════════════════════════════════

interface ContextArgs {
  etymology: Etymology;
  gender: number;
  isName: boolean;
}

type Evaluator = (
  ctx: ContextArgs,
  value: string,
  pos: number,
) => string | false;

interface Rule {
  default: string;
  after?: [RegExp | string, Evaluator][];
  before?: [RegExp | string, Evaluator][];
  afterAndBefore?: { after: RegExp; before: RegExp; evaluator: Evaluator }[];
  general?: Evaluator[];
}

interface TrieNode {
  [key: string]: TrieNode | null;
}

const CYRILLIC_RULES: Record<string, Rule> = {
  Alfa: {
    default: "\u0259",
    after: [
      [matchTrailingConsonant(), () => "\u0259\u0259"],
      [matchConsonantVowelCluster(["\u2c81", "\u2c89"]), () => "\u0259\u0259"],
    ],
    before: [
      [new RegExp("\u2c9f|\u2ca9"), () => "a"],
      [new RegExp("\u03ef"), () => "\u02cc\u0250"],
    ],
  },
  Vita: { default: "b", after: [[matchVowel(), () => "v"]] },
  Gamma: {
    default: "\u0263",
    after: [
      [matchFrontVowel(), () => "\u0261"],
      [matchVelar(), () => "n"],
    ],
  },
  Delta: {
    default: "\xf0",
    general: [(_ctx: ContextArgs, _value: string, pos: number) => !!pos && "d"],
  },
  Ei: {
    default: "e",
    after: [
      [matchTrailingConsonant(), () => "\u025b\u0258"],
      [matchConsonantVowelCluster(["\u2c89", "\u2c81"]), () => "\u025b\u0258"],
      [/\s+|$/i, () => "\u025b\u0258"],
    ],
  },

  Zita: { default: "z" },
  Ita: { default: "i\u02d0j" },
  Thita: {
    default: "\u03b8",
    before: [[new RegExp("\u03e3|\u2ca5"), () => "t"]],
  },
  Yota: {
    default: "\u026a",
    after: [[new RegExp(`(${matchJinkim().source})\u2c81$`), () => "e\u026a"]],
  },
  Kapa: { default: "k" },
  Lola: { default: "l" },
  Mey: { default: "m" },
  Ney: { default: "n" },
  Exi: { default: "ks" },
  Omicron: {
    default: "\u2016o",
    after: [[new RegExp("\u2ca9"), () => "u"]],
    before: [
      [matchConsonant(), () => "o"],
      [new RegExp("\u2c93|\u2c8f"), () => "o"],
    ],
  },
  Pi: { default: "p" },
  Ro: { default: "r" },
  Ceema: {
    default: "s",
    after: [
      [matchOpenVowel(), () => "s\u02e4"],
      [
        new RegExp("\u2c99"),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "z",
      ],
    ],
  },
  Tav: {
    default: "t",
    after: [
      [matchOpenVowel(), () => "t\u02e4"],
      [
        new RegExp("\u2c99"),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "z",
      ],
    ],
  },
  Upsilon: {
    default: "i",
    before: [
      [new RegExp("\u2c9f"), () => "uu\u02d0"],
      [new RegExp("\u2c89|\u2c81"), () => "v"],
    ],
  },
  Fi: { default: "f" },
  Ki: {
    default: "k",
    after: [
      [
        matchFrontVowel(),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "\u0283",
      ],
    ],
    general: [(ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "x"],
  },
  Epsi: { default: "ps" },
  Omega: {
    default: "o\u02d0\u028a",
    before: [[matchJinkim(), () => "o\u02d0\u028a \u02d0|"]],
  },
  Shai: { default: "\xe7" },
  Fai: { default: "f" },
  Khai: { default: "x" },
  Hoori: { default: "h" },
  Janja: { default: "g", after: [[matchFrontVowel(), () => "\u029d"]] },
  Cheema: { default: "t\xe7" },
  Ti: { default: "ti" },
  JinkimStart: CYRILLIC_JINKIM,
  JinkimMiddle: CYRILLIC_JINKIM,
};

const SHENUTEAN_RULES: Record<string, Rule> = {
  Alfa: {
    default: "a",
    after: [
      [matchTrailingConsonant(), () => "a\u02d0a\u02d0"],
      [
        matchConsonantVowelCluster(["\u2c81", "\u2c89"]),
        () => "a\u02d0a\u02d0",
      ],
    ],
    before: [
      [new RegExp("\u2c9f|\u2ca9"), () => "a\u02d0a\u02d0"],
      [new RegExp("\u03ef"), () => " \u0294a"],
    ],
  },
  Vita: { default: "b", after: [[matchVowel(), () => "f\u02c8"]] },
  Gamma: {
    default: "\u0263",
    after: [
      [matchFrontVowel(), () => "\u0261"],
      [matchVelar(), () => "n"],
    ],
  },
  Delta: {
    default: "\xf0",
    general: [(_ctx: ContextArgs, _value: string, pos: number) => !!pos && "d"],
  },
  Ei: {
    default: "i",
    after: [
      [matchTrailingConsonant(), () => "i\u02d0"],
      [
        matchConsonantVowelCluster(["\u2c89", "\u2c81"]),
        () => "i\u02d0i\u02d0",
      ],
      [/\s+|$/i, () => "i\u02d0i\u02d0"],
    ],
  },

  Zita: { default: "z" },
  Ita: { default: "j" },
  Thita: {
    default: "\u03b8",
    before: [[new RegExp("\u03e3|\u2ca5"), () => "t\u02c8"]],
  },
  Yota: {
    default: "i\u02d0",
    after: [[new RegExp(`(${matchJinkim().source})\u2c81$`), () => "j"]],
  },
  Kapa: { default: "k" },
  Lola: { default: "l" },
  Mey: { default: "m" },
  Ney: { default: "n" },
  Exi: { default: "ks" },
  Omicron: {
    default: "u",
    before: [
      [matchConsonant(), () => "u\u02d0"],
      [new RegExp("\u2c93|\u2c8f"), () => "u"],
    ],
  },
  Pi: { default: "bb" },
  Ro: { default: "r" },
  Ceema: {
    default: "s",
    after: [
      [
        new RegExp("\u2c99"),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "z",
      ],
    ],
  },
  Tav: {
    default: "t\u02c8",
    after: [
      [matchOpenVowel(), () => "t\u02e4"],
      [
        new RegExp("\u2c99"),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "z",
      ],
    ],
  },
  Upsilon: {
    default: "i",
    afterAndBefore: [
      {
        after: matchVowel(),
        before: new RegExp("\u2c9f"),
        evaluator: () => "\u02d0uu\u02d0\u203f",
      },
    ],
    before: [
      [new RegExp("\u2c9f"), () => "\u02d0u"],
      [new RegExp(`(${matchJinkim().source})\u2c9f`), () => "\u02d0u"],
      [new RegExp("\u2c89|\u2c81"), () => "f\u02c8"],
    ],
  },
  Fi: { default: "f" },
  Ki: {
    default: "k",
    after: [
      [
        matchFrontVowel(),
        (ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "\u0283",
      ],
    ],
    general: [(ctx: ContextArgs) => ctx.etymology === Etymology.Greek && "x"],
  },
  Epsi: { default: "ps" },
  Omega: {
    default: "u\u02d0",
    after: [
      [/\s+|^/i, () => "u\u02d0"],
      [new RegExp("\u2c9f|\u2ca9"), () => "u"],
    ],
  },
  Shai: { default: "\u0283" },
  Fai: { default: "f" },
  Khai: { default: "x" },
  Hoori: { default: "h" },
  Janja: { default: "g" },
  Cheema: { default: "t\u0283" },
  Ti: { default: "ti\u02d0" },
  JinkimStart: SHENUTEAN_JINKIM,
  JinkimMiddle: SHENUTEAN_JINKIM,
};

// ═══════════════════════════════════════════════════════════════════════
// § 6  PREFIX TRIE
// ═══════════════════════════════════════════════════════════════════════

function _trieInsert(word: string, node: TrieNode | null): void {
  let len = word.length;
  if (!len) {
    return;
  }
  while (len--) {
    const chunk = word.substr(0, len + 1);
    if (node !== null && Object.prototype.hasOwnProperty.call(node, chunk)) {
      if (node[chunk] === null) {
        node[chunk] = { "": null };
      }
      _trieInsert(word.substr(len + 1), node[chunk]);
      return;
    }
  }
  if (node === null) {
    throw new Error("Unexpected trie error.");
  }
  const keys = Object.keys(node);
  const found = keys.some((k) => {
    let q = 0;
    while (q < len && k[q] === word[q]) {
      q++;
    }
    const prefix = q < len && q > 1 ? k.substr(0, q) : "";
    if (!prefix) {
      return false;
    }
    node[prefix] = {};
    _trieInsert(k.substr(q), node[prefix]);
    (node[prefix] as Record<string, TrieNode | null>)[k.substr(q)] =
      node[k] ?? null;
    _trieInsert(word.substr(q), node[prefix]);
    delete node[k];
    return true;
  });
  if (!found) {
    node[word] = null;
  }
}

function trieSearch(word: string, root: TrieNode | null) {
  const lower = word.toLocaleLowerCase();
  const len = lower.length;
  let matched = "";
  let pos = 0;
  let node = root;
  while (node !== null && pos < len) {
    let chunk = "";
    while (!Object.prototype.hasOwnProperty.call(node, chunk) && pos < len) {
      chunk += lower[pos++];
    }
    if (chunk === "" && Object.keys(node).length > 1) {
      let tmp = chunk;
      let tmpPos = pos;
      while (!Object.prototype.hasOwnProperty.call(node, tmp) && tmpPos < len) {
        tmp += lower[tmpPos++];
      }
      if (Object.prototype.hasOwnProperty.call(node, tmp)) {
        chunk = tmp;
        pos = tmpPos;
      }
    }
    if (!Object.prototype.hasOwnProperty.call(node, chunk)) {
      break;
    }
    matched += chunk;
    node = node[chunk] === null ? null : node[chunk];
  }
  return { prefix: matched, isProper: node === null };
}

const PREFIX_TRIE_DATA: TrieNode = {
  "\u03e3\u2c81": {
    "": null,
    "\u2c99": null,
    "\u2c93": null,
    "\u2c95": null,
    "\u2ca3\u2c89": { "": null, "\u2ca7\u2c89\u2c9b": null },
    "\u03e5": null,
    "\u2ca5": null,
    "\u2c9b": null,
    "\u2ca9": null,
  },
  "\u2c9b\u0300": {
    "": null,
    "\u2c9b\u2c89": null,
    "\u2ca7\u2c81\u2ca3": {
      "\u2c93": null,
      "\u2c89\u2c95": null,
      "\u2c89": {
        "": null,
        "\u03e5": null,
        "\u2ca5": null,
        "\u2c9b": null,
        "\u2ca7\u2c89\u2c9b": null,
      },
      "\u2c9f\u2ca9": null,
    },
  },
  "\u2c99\u0300": {
    "": null,
    "\u2ca1\u2c81": {
      "": null,
      "\u2ca3\u2c93": null,
      "\u2ca3\u2c89\u2c95": null,
      "\u2ca3\u2c89": {
        "": null,
        "\u03e5": null,
        "\u2ca5": null,
        "\u2c9b": null,
      },
      "\u2ca3\u2c81\u2c89\u2ca7\u2c89\u2c9b": null,
      "\u2ca3\u2c9f\u2ca9": null,
    },
    "\u2ca1\u2c89": { "\u2ca3": null, "\u2c9b\u0300\u2c91\u2ca3\u2c89": null },
  },
  "\u2c89\u0300": {
    "": null,
    "\u2ca1\u03eb\u2c93\u2c9b": {
      "\u2ca7": {
        "\u2c81": null,
        "\u2c89\u2c95": null,
        "\u2c89": {
          "": null,
          "\u03e5": null,
          "\u2ca5": null,
          "\u2c9b": null,
          "\u2ca7\u2c89\u2c9b": null,
        },
        "\u2c9f\u2ca9": null,
      },
      "\u0300\u2c91\u2ca3": {
        "\u2c93": null,
        "\u2c89\u2c95": null,
        "\u2c89": {
          "": null,
          "\u03e5": null,
          "\u2ca5": null,
          "\u2c9b": null,
          "\u2ca7\u2c89\u2c9b": null,
        },
        "\u2c9f\u2ca9": null,
      },
    },
  },
  "\u2c9f\u2ca9": null,
  "\u2c89\u2ca9": { "": null, "\u0300\u2c89": null },
  "\u2ca1\u2c93": { "": null, "\u2c81\u2ca7": null },
  "\u2cab\u0300": null,
  "\u2ca1\u0300": null,
  "\u03ef": null,
  "\u2ca7\u0300": null,
  "\u2c91\u0300": null,
  "\u2c9b\u2c93": null,
  "\u2c9b\u2c89\u2c9b": { "": null },
  "\u2c9b\u2c89": {
    "": null,
    "\u0300\u2c99": {
      "": null,
      "\u2ca1\u2c81": {
        "\u2c93": null,
        "\u2c95": null,
        "\u2ca3\u2c89": {
          "": null,
          "\u2ca7\u2c89": { "": null, "\u2c9b": null },
        },
        "\u03e5": null,
        "\u2ca5": null,
        "\u2c9b": null,
        "\u2ca9": null,
      },
    },
    "\u2ca7": { "": null, "\u2c89\u2c9b": null },
    "\u2c95": null,
    "\u03e5": null,
    "\u2ca5": null,
  },
  "\u2cab\u2c8f": { "": null, "\u2c89\u2ca7": null, "\u2c89\u2c91": null },
  "\u2c91\u2c8f": { "": null, "\u2c89\u2ca7": null, "\u2c89\u2c91": null },
  "\u2c9b\u2c8f": { "": null, "\u2c89\u2ca7": null, "\u2c89\u2c91": null },
  "\u2c89\u2ca7": { "": null },
  "\u2c89\u2c91": {
    "": null,
    "\u2ca3\u2c93": null,
    "\u2ca3\u2c89\u2c95": null,
    "\u2ca3\u2c89": {
      "": null,
      "\u03e5": null,
      "\u2ca5": null,
      "\u2c9b": null,
      "\u2ca7\u2c89\u2c9b": null,
    },
    "\u2ca3\u2c9f\u2ca9": null,
  },
  "\u2ca1\u2c89": {
    "\u2ca7": {
      "": null,
      "\u2c89\u03e9": null,
      "\u2c89\u2ca1": null,
      "\u2c89\u2ca3": null,
      "\u2c89\u2ca5": null,
    },
    "\u2c91": null,
    "\u2c95": null,
    "\u03e5": null,
    "\u2ca5": null,
    "\u2c9b": null,
  },
  "\u2c91\u2c89\u2ca7": null,
  "\u2c81\u2ca7": null,
  "\u2c81\u2c91": null,
  "\u2c95\u2c89": null,
  "\u2ca1\u2c81": { "": null, "\u2c93": null },
  "\u2ca1\u2c9f\u2ca9": null,
  "\u2ca7\u2c81": { "\u2c93": null },
  "\u2ca7\u2c89": {
    "\u2c95": { "": null },
    "\u03e5": null,
    "\u2ca5": null,
    "\u2c9b": { "": null },
    "\u2ca7\u2c89\u2c9b": { "": null },
  },
  "\u2ca7\u2c9f\u2ca9": null,
  "\u2c9b\u2c81": {
    "\u2c93": null,
    "\u2c95": null,
    "\u2ca3\u2c89": null,
    "\u03e5": null,
    "\u2ca5": null,
    "\u2c9b": null,
    "\u2ca3\u2c81\u2ca7\u2c89\u2c9b": null,
    "\u2ca9": null,
    "\u2cad\u2c9b\u2c81": null,
  },
  "\u2c9b\u2c9f\u2ca9": null,
  "\u2ca5\u2c81": { "": null, "\u2c9b": null },
  "\u2ca3\u2c89\u03e5": null,
  "\u03e5\u2c81\u2c93": null,
  "\u2c99\u2c81": {
    "\u2c9b": null,
    "\u0300\u2c9b": null,
    "\u2c93": null,
    "\u2ca3\u2c93": null,
    "\u2ca3\u2c89\u2c95": null,
    "\u2ca3\u2c89": {
      "": null,
      "\u03e5": null,
      "\u2ca5": null,
      "\u2c9b": null,
      "\u2ca7\u2c89\u2c9b": null,
    },
    "\u2ca3\u2c9f\u2ca9": null,
  },
  "\u03ed\u2c81\u2ca5\u2c93": null,
  "\u03e9\u2c81": { "\u2c9b": null, "\u2c99": null },
  "\u2c99\u2c89": { "\u2ca7": null, "\u2c91": null },
  "\u2c95\u0300": null,
  "\u2cad\u0300": null,
  "\u03e5\u0300": null,
  "\u2ca5\u0300": null,
  "\u2ca5\u2c89": null,
  "\u2c81\u2c93": null,
  "\u2c81\u2c95": null,
  "\u2c81\u2ca3": {
    "\u2c93": null,
    "\u2c89": { "": null, "\u2ca7\u2c89\u2c9b": null },
  },
  "\u2c81\u03e5": null,
  "\u2c81\u2ca5": null,
  "\u2c81\u2c9b": null,
  "\u2c81\u2ca9": null,
  "\u2c89\u2c93": { "": null, "\u0300\u2c89": null },
  "\u2c89\u2c95": { "": null, "\u0300\u2c89": null },
  "\u2c89\u2ca3\u2c89": {
    "": null,
    "\u2ca7\u2c89\u2c9b": { "": null, "\u0300\u2c89": null },
    "\u0300\u2c89": null,
  },
  "\u2c89\u03e5": { "": null, "\u0300\u2c89": null },
  "\u2c89\u2ca5": { "": null, "\u0300\u2c89": { "": null } },
  "\u2c89\u2c9b": { "": null, "\u0300\u2c89": null },
  "\u2c81\u2cad\u2c9b\u2c81": null,
  "\u2c89\u2cad\u2c9b\u2c81": null,
  "\u03e3\u0300\u2ca7\u2c89\u2c99": null,
  "\u03e3\u2c9f\u2ca9": null,
};

const rt = {
  T: PREFIX_TRIE_DATA,
  prefix(word: string) {
    return trieSearch(word, this.T);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// § 7  WORD DIVIDER
// ═══════════════════════════════════════════════════════════════════════

/** Regex source matching any consonant (used to build syllable patterns). */
const _consonantSrc = matchConsonant().source;

/** Open syllable: consonant + vowel (CV). */
const _openSyllableSrc = `(${_consonantSrc}|\u2c9f\u2ca9|\u2c93)(${matchVowel().source}|\u2c9f\u2ca9)`;

/** Closed syllable: consonant + vowel + consonant(s) (CVC+). */
const _closedSyllableSrc = `${_openSyllableSrc}(${_consonantSrc})+`;

/** Matches Coptic diphthong (two-vowel) sequences for syllable splitting. */
const DIPHTHONG_RE =
  /(\u2c81\u2c89|\u2c81\u2c8f|\u2c81\u2c9f|\u2c81\u2cb1|\u2c89\u2c81|\u2c89\u2c9f|\u2c89\u2cb1|\u2c89\u2c8f|\u2c8f\u2c81|\u2c8f\u2c89|\u2c8f\u2c9f|\u2c8f\u2cb1|\u2cb1\u2c9f|\u2cb1\u2c89|\u2cb1\u2c81|\u2cb1\u2c8f|\u2c9f\u2cb1|\u2c9f\u2c9f|\u2c9f\u2c89|\u2c9f\u2c8f|\u2c9f\u2c81)/i;

/** Matches Coptic triphthong (three-vowel) sequences for syllable splitting. */
const TRIPHTHONG_RE = /(\u2c9f\u2ca9\u2cb1)|(\u2c9f\u2ca9\u2c9f(?!\u03e9))/i;

/**
 * Splits Coptic text into syllable chunks using prefix detection,
 * diphthong/triphthong boundaries, and open/closed syllable patterns.
 */
class WordDivider {
  jinkimSyllableExpr: RegExp;
  openSyllableExpr: RegExp;
  closedSyllableExpr: RegExp;
  closedSyllableExprFull: RegExp;
  openSyllableExprFull: RegExp;
  knownSyllableExpr: RegExp;

  constructor() {
    this.jinkimSyllableExpr = new RegExp(
      `.(${matchJinkim().source})|^(${matchJinkim().source}).`,
      "i",
    );
    this.openSyllableExpr = new RegExp(_openSyllableSrc, "i");
    this.closedSyllableExpr = new RegExp(_closedSyllableSrc, "i");
    this.closedSyllableExprFull = new RegExp(`^${_closedSyllableSrc}$`, "i");
    this.openSyllableExprFull = new RegExp(`^${_openSyllableSrc}$`, "i");
    this.knownSyllableExpr = new RegExp("(\u03ef)", "i");
  }

  divide(word: string, checkPrefixes = true, checkSplits = true): string[] {
    const result: string[] = [];
    let tail: string;
    word = word.replace(SPACER_RE, "").trim();
    if (word.length <= 2) {
      return [word];
    }

    if (checkSplits) {
      const { prefixes, rest } = this._prefixPass(word);
      if (prefixes.length > 0) {
        return [
          ...prefixes.flatMap((p) =>
            p.length > 3 ? this.divide(p, false, false) : [p],
          ),
          ...this.divide(rest, false, false),
        ];
      }
    }

    const splitResult = this._splitPass(word);
    if (splitResult.length > 1) {
      return splitResult.flatMap((part, idx) =>
        this.divide(part, idx === 0 && checkPrefixes, false),
      );
    }

    let offset = 0,
      endIdx = word.length - 1;
    do {
      tail = offset ? word.slice(endIdx, -offset) : word.slice(endIdx);
      const oneChar = tail.length === 1 && this.knownSyllableExpr.test(tail);
      const multiChar =
        tail.length >= 2 &&
        (this.openSyllableExpr.test(tail) ||
          this.closedSyllableExpr.test(tail));
      const notExtendable = !(
        word.length > tail.length &&
        (this.closedSyllableExprFull.test(word[endIdx - 1] + tail) ||
          this.openSyllableExprFull.test(word[endIdx - 1] + tail))
      );
      if (
        (oneChar || (multiChar && notExtendable)) &&
        word.length > tail.length + offset + 1
      ) {
        result.push(tail);
        offset += tail.length;
        endIdx = word.length - offset - 1;
        tail = "";
      }
      if (endIdx <= 0 && tail.length > 0) {
        result.push(tail);
        break;
      }
      endIdx--;
    } while (offset < word.length);

    return result.reverse();
  }

  _prefixPass(word: string) {
    let p = rt.prefix(word);
    const prefixes: string[] = [];
    let rest = word.slice(0);
    while (
      p.isProper &&
      !("\u2c9f\u2ca9" === p.prefix && rest.length - 2 <= 2) &&
      rest.length - p.prefix.length > 2
    ) {
      prefixes.push(rest.slice(0, p.prefix.length));
      rest = rest.slice(p.prefix.length);
      p = rt.prefix(rest);
    }
    return { prefixes, rest };
  }

  _splitPass(word: string) {
    const m = word.match(this.jinkimSyllableExpr);
    if (m) {
      const chunk = m[0];
      return m.index
        ? [word.slice(0, m.index), chunk, word.slice(m.index + chunk.length)]
        : [chunk, word.slice(chunk.length)];
    }
    const mRn = word.match(DIPHTHONG_RE);
    const mPt = word.match(TRIPHTHONG_RE);
    let cut = 0;
    if (mPt) {
      cut = (mPt.index || 0) + 2;
    } else if (mRn) {
      cut = (mRn.index || 0) + 1;
    }
    return cut ? [word.slice(0, cut), word.slice(cut)] : [word];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// § 8  MAPPER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Core IPA mapper: tokenises Coptic text, applies pronunciation rules
 * character-by-character, and evaluates contextual conditions (after/before/
 * afterAndBefore/general) to produce an IPA string.
 */
class Mapper {
  readonly rules: Record<string, Rule>;
  divider: WordDivider;

  constructor(accentRuleSet: Record<string, Rule>, wordDivider: WordDivider) {
    this.rules = accentRuleSet;
    this.divider = wordDivider;
  }

  map(input: string | { value: string; wordType: string }): string {
    if (typeof input === "string") {
      return [...input.matchAll(TOKEN_RE)]
        .map((m) => {
          const groups = m.groups as Record<string, string | undefined>;
          return groups?.word
            ? this.map({ value: groups.word, wordType: "word" })
            : groups?.spacer || "";
        })
        .join("");
    }

    if (input.wordType === "spacer") {
      return input.value;
    }

    // Jinkim reordering
    const reordered = input.value.replace(
      new RegExp(`(.)(${matchJinkim().source})`, "g"),
      "$2$1",
    );
    const token = { ...input, value: reordered };

    const syllables = this.divider
      ? this.divider.divide(token.value)
      : [token.value];
    const ctx: ContextArgs = {
      etymology: Etymology.Egyptian,
      gender: 0,
      isName: false,
    };

    let ipa = "";
    let syllIdx = 0,
      syllOffset = 0;

    const chars = ["", ...token.value.toLowerCase()];
    chars.reduce((prev, ch, pos) => {
      if (SPACER_RE.test(ch)) {
        return prev.concat(ch);
      }

      const charName = CHAR_MAP[ch];
      const remaining = token.value.substring(pos);

      if (pos > syllables[syllIdx].length + syllOffset) {
        syllOffset += syllables[syllIdx].length;
        syllIdx++;
      }

      ipa += this._evaluate(prev, remaining, this.rules[charName], [
        ctx,
        token.value,
        pos,
      ]);
      return prev.concat(ch);
    });

    return ipa;
  }

  _evaluate(
    prevChars: string,
    nextChars: string,
    rule: Rule,
    ctxArgs: [ContextArgs, string, number],
  ): string {
    const defaultVal = rule?.default ?? "\u2193";
    if (
      !(rule?.after || rule?.before || rule?.afterAndBefore || rule?.general)
    ) {
      return defaultVal;
    }

    const entries = Object.entries(rule).filter(([k]) =>
      ["after", "before", "general", "afterAndBefore"].includes(k),
    );

    for (const [kind, conditions] of entries) {
      let matched = false;
      let result: string | false = "\u2193";
      for (const cond of (conditions ?? []) as
        | NonNullable<Rule["after"]>
        | NonNullable<Rule["afterAndBefore"]>
        | Evaluator[]) {
        switch (kind) {
          case "after": {
            const [pattern, evaluator] = cond as [RegExp | string, Evaluator];
            matched = this._test(pattern, nextChars, "after");
            if (matched) {
              result = evaluator(...ctxArgs);
            }
            break;
          }
          case "before": {
            const [pattern, evaluator] = cond as [RegExp | string, Evaluator];
            matched = this._test(pattern, prevChars, "before");
            if (matched) {
              result = evaluator(...ctxArgs);
            }
            break;
          }
          case "afterAndBefore": {
            const abCond = cond as {
              after: RegExp;
              before: RegExp;
              evaluator: Evaluator;
            };
            matched =
              this._test(abCond.after, nextChars, "after") &&
              this._test(abCond.before, prevChars, "before");
            if (matched) {
              result = abCond.evaluator(...ctxArgs);
            }
            break;
          }
          case "general": {
            result = (cond as Evaluator)(...ctxArgs);
            matched = !!result;
            break;
          }
        }
        if (matched && result !== false) {
          return result;
        }
      }
    }
    return defaultVal;
  }

  _test(
    pattern: RegExp | string,
    haystack: string,
    direction: "after" | "before",
  ): boolean {
    if (pattern instanceof RegExp) {
      const src = pattern.source;
      const re =
        direction === "after"
          ? new RegExp(
              `^(${src.replace("$", "")})${src.endsWith("$") ? "($|\\s+.*)" : ".*"}`,
            )
          : new RegExp(
              `${src.startsWith("^") ? "" : ".*"}(${src.replace("(^|.*\\s+)", "")})$`,
            );
      return re.test(haystack);
    }
    if (typeof pattern === "string") {
      return haystack.includes(pattern);
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// § 9  PRONUNCIATION MAPPER
// ═══════════════════════════════════════════════════════════════════════

const divider = new WordDivider();
const mappers = {
  [Pronunciation.Shenutean]: new Mapper(SHENUTEAN_RULES, divider),
  [Pronunciation.Cyrillic]: new Mapper(CYRILLIC_RULES, divider),
};

export const VOICES = {
  shakir: {
    id: "ar-EG-ShakirNeural",
    pronunciation: Pronunciation.Shenutean,
    label: "Shakir (Shenutean Male)",
  },
  salma: {
    id: "ar-EG-SalmaNeural",
    pronunciation: Pronunciation.Shenutean,
    label: "Salma (Shenutean Female)",
  },
  jenny: {
    id: "en-US-JennyMultilingualV2Neural",
    pronunciation: Pronunciation.Shenutean,
    label: "Jenny (Shenutean Multilingual)",
  },
  ryan: {
    id: "en-US-RyanMultilingualNeural",
    pronunciation: Pronunciation.Shenutean,
    label: "Ryan (Shenutean Multilingual)",
  },
  nestoras: {
    id: "el-GR-NestorasNeural",
    pronunciation: Pronunciation.Cyrillic,
    label: "Nestoras (Cyrillic Male)",
  },
  stefanos: {
    id: "el-GR-Stefanos",
    pronunciation: Pronunciation.Cyrillic,
    label: "Stefanos (Cyrillic Male)",
  },
  athina: {
    id: "el-GR-AthinaNeural",
    pronunciation: Pronunciation.Cyrillic,
    label: "Athina (Cyrillic Female)",
  },
  aria: {
    id: "en-US-AriaNeural",
    pronunciation: Pronunciation.Cyrillic,
    label: "Aria (Cyrillic English)",
  },
};

export type VoiceKey = keyof typeof VOICES;

/**
 * Convert Coptic Unicode text to an IPA string.
 * @param {string} copticText
 * @param {Pronunciation} pronunciation
 * @returns {string} IPA phonetic string
 */
export function copticToIPA(
  copticText: string,
  pronunciation: Pronunciation = Pronunciation.Shenutean,
): string {
  return mappers[pronunciation].map(copticText);
}
