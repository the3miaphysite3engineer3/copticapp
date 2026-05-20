import { describe, expect, it } from "vitest";

import {
  prepareDictionaryForSearch,
  searchPreparedDictionary,
  searchPreparedDictionaryPage,
} from "./search";

import type { DictionaryClientEntry } from "./types";

const lordEntry: DictionaryClientEntry = {
  id: 17,
  headword: "ϭⲱⲓⲥ",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "ϭⲱⲓⲥ",
      nominal: "",
      pronominal: "",
      stative: "",
      variants: {
        absolute: ["⳪"],
      },
    },
  },
  senses: [{ grammar: { pos: "N" }, meanings: { en: ["lord"] } }],
  greekContext: { equivalents: ["κυριοσ"] },
};

const fatherEntry: DictionaryClientEntry = {
  id: 18,
  headword: "ⲉⲓⲱⲧ",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "ⲉⲓⲱⲧ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  senses: [
    { grammar: { gender: "M", pos: "N" }, meanings: { en: ["father"] } },
  ],
};

const elderEntry: DictionaryClientEntry = {
  id: 1673839349,
  headword: "ⳳⲉⲗⲗⲱ",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "ⳳⲉⲗⲗⲱ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  senses: [{ grammar: { pos: "N" }, meanings: { en: ["elder"] } }],
};

const prepositionEntry: DictionaryClientEntry = {
  id: 946,
  headword: "ⲛ-",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "",
      nominal: "ⲛ̀-",
      pronominal: "ⲙ̀ⲙⲟ=",
      stative: "",
    },
  },
  senses: [{ grammar: { pos: "PREP" }, meanings: { en: ["with, by"] } }],
};

const runEntry: DictionaryClientEntry = {
  id: 19,
  headword: "ⲃⲱⲕ",
  etym: "Egy",
  dialects: {
    S: {
      absolute: "ⲃⲱⲕ",
      nominal: "",
      pronominal: "",
      stative: "",
    },
  },
  senses: [{ grammar: { pos: "V" }, meanings: { en: ["run"] } }],
};

const takeEntry: DictionaryClientEntry = {
  id: 130,
  headword: "ϫⲓ",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "ϭⲓ",
      nominal: "ϭⲓ-",
      pronominal: "ϭⲓⲧ=",
      stative: "ϭⲏⲟⲩ†",
      participles: ["ϭⲁⲓ~"],
      variants: {
        constructParticiples: ["ϭⲁⲩ~"],
      },
    },
  },
  senses: [{ grammar: { pos: "V" }, meanings: { en: ["take"] } }],
};

const guideEntry: DictionaryClientEntry = {
  id: 11146,
  relations: [
    {
      targetId: takeEntry.id,
      targetEntry: {
        dialects: takeEntry.dialects,
        headword: takeEntry.headword,
        id: takeEntry.id,
      },
      type: "COMPOUND_WITH",
    },
  ],
  headword: "ϭⲁⲩⲙⲱⲓⲧ",
  etym: "Egy",
  dialects: {
    B: {
      absolute: "ϭⲁⲩⲙⲱⲓⲧ",
    },
  },
  senses: [
    {
      grammar: { gender: "BOTH", pos: "N" },
      meanings: { en: ["guide, leader"], nl: ["gids, leider"] },
    },
  ],
};

const accentedParticipleEntry: DictionaryClientEntry = {
  id: 130,
  headword: "ϫⲓ",
  etym: "Egy",
  dialects: {
    S: {
      absolute: "ϫⲓ",
      nominal: "ϫⲓ-",
      pronominal: "ϫⲓⲧ=",
      stative: "ϫⲏⲩ†",
      participles: ["ϫⲁⲓ̈~"],
      variants: {
        constructParticiples: ["ϫⲁⲩ~"],
      },
    },
  },
  senses: [{ grammar: { pos: "V" }, meanings: { en: ["take"] } }],
};

describe("dictionary search", () => {
  it("indexes absolute Bohairic variants alongside the main spelling", () => {
    const preparedDictionary = prepareDictionaryForSearch([lordEntry]);

    expect(
      searchPreparedDictionary("ϭⲱⲓⲥ", preparedDictionary, [lordEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([17]);
    expect(
      searchPreparedDictionary("⳪", preparedDictionary, [lordEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([17]);
  });

  it("matches khei variants as the same search character", () => {
    const preparedDictionary = prepareDictionaryForSearch([elderEntry]);

    expect(
      searchPreparedDictionary("\u03e7ⲉⲗⲗⲱ", preparedDictionary, [
        elderEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1673839349]);
    expect(
      searchPreparedDictionary("ⳳⲉⲗⲗⲱ", preparedDictionary, [elderEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([1673839349]);
    expect(
      searchPreparedDictionary("\u03e6ⲈⲖⲖⲰ", preparedDictionary, [
        elderEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1673839349]);
    expect(
      searchPreparedDictionary("ⳲⲈⲖⲖⲰ", preparedDictionary, [elderEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([1673839349]);
    expect(
      searchPreparedDictionary(
        "ⳲⲈⲖⲖⲰ",
        preparedDictionary,
        [elderEntry],
        true,
      ).map((entry) => entry.id),
    ).toEqual([1673839349]);
  });

  it("treats jinkim-marked and unmarked bound forms as equivalent", () => {
    const preparedDictionary = prepareDictionaryForSearch([prepositionEntry]);

    expect(
      searchPreparedDictionary("ⲙ̀ⲙⲟ=", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual([946]);
    expect(
      searchPreparedDictionary("ⲙⲙⲟ=", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual([946]);
    expect(
      searchPreparedDictionary("ⲛ̀-", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual([946]);
    expect(
      searchPreparedDictionary("ⲛ-", preparedDictionary, [
        prepositionEntry,
      ]).map((entry) => entry.id),
    ).toEqual([946]);
  });

  it("indexes primary and variant construct participles", () => {
    const preparedDictionary = prepareDictionaryForSearch([takeEntry]);

    expect(
      searchPreparedDictionary("ϭⲁⲓ", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([130]);
    expect(
      searchPreparedDictionary("ϭⲁⲓ~", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([130]);
    expect(
      searchPreparedDictionary("ϭⲁⲩ", preparedDictionary, [takeEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([130]);
  });

  it("indexes construct participle compounds as distinct entries", () => {
    const preparedDictionary = prepareDictionaryForSearch([guideEntry]);

    expect(
      searchPreparedDictionary("ϭⲁⲩⲙⲱⲓⲧ", preparedDictionary, [guideEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([11146]);
    expect(
      searchPreparedDictionary("leader", preparedDictionary, [guideEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([11146]);
    expect(
      searchPreparedDictionary("leider", preparedDictionary, [guideEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([11146]);
  });

  it("indexes grouped meanings", () => {
    const groupedOnlyEntry: DictionaryClientEntry = {
      id: 1143356163,
      headword: "ϯ",
      etym: "Egy",
      dialects: {
        B: {
          absolute: "ϯ",
        },
      },
      senses: [
        {
          grammar: { pos: "V", valency: "TR" },
          meanings: { en: ["give"], nl: ["geven"] },
        },
      ],
    };
    const preparedDictionary = prepareDictionaryForSearch([groupedOnlyEntry]);

    expect(
      searchPreparedDictionary("give", preparedDictionary, [
        groupedOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1143356163]);
    expect(
      searchPreparedDictionary("geven", preparedDictionary, [
        groupedOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1143356163]);
  });

  it("matches accented construct participles with unaccented queries", () => {
    const preparedDictionary = prepareDictionaryForSearch([
      accentedParticipleEntry,
    ]);

    expect(
      searchPreparedDictionary("ϫⲁⲓ", preparedDictionary, [
        accentedParticipleEntry,
      ]).map((entry) => entry.id),
    ).toEqual([130]);
    expect(
      searchPreparedDictionary("ϫⲁⲓ̈~", preparedDictionary, [
        accentedParticipleEntry,
      ]).map((entry) => entry.id),
    ).toEqual([130]);
  });

  it("pages filtered results without building the full matched list", () => {
    const dictionary = [lordEntry, fatherEntry, elderEntry, runEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 1,
        offset: 0,
        preparedDictionary,
        query: "",
        selectedDialect: "B",
        selectedPartOfSpeech: "N",
      }),
    ).toMatchObject({
      entries: [{ id: 17 }],
      hasMore: true,
      nextOffset: 1,
      totalEntries: 4,
      totalMatches: 3,
    });

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 1,
        offset: 1,
        preparedDictionary,
        query: "",
        selectedDialect: "B",
        selectedPartOfSpeech: "N",
      }),
    ).toMatchObject({
      entries: [{ id: 18 }],
      hasMore: true,
      nextOffset: 2,
      totalMatches: 3,
    });
  });

  it("filters by every structured meaning-group grammar value", () => {
    const adjectivalNounEntry: DictionaryClientEntry = {
      id: 2639070627,
      headword: "ⲉⲛⲉϩ",
      etym: "Egy",
      dialects: {
        B: {
          absolute: "ⲉⲛⲉϩ",
        },
      },
      senses: [
        {
          grammar: {
            pos: "N",
            gender: "M",
          },
          meanings: { en: ["eternity"] },
        },
        {
          grammar: {
            pos: "ADJ",
          },
          meanings: { en: ["eternal"] },
        },
      ],
    };
    const dictionary = [adjectivalNounEntry, runEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 10,
        offset: 0,
        preparedDictionary,
        query: "",
        selectedDialect: "ALL",
        selectedPartOfSpeech: "ADJ",
      }),
    ).toMatchObject({
      entries: [{ id: 2639070627 }],
      totalMatches: 1,
    });
  });

  it("matches entries by structured plural inflected forms", () => {
    const treasureEntry: DictionaryClientEntry = {
      id: 7,
      headword: "ⲁϩⲟ",
      etym: "Egy",
      dialects: {
        S: {
          absolute: "ⲁϩⲟ",
          nominal: "",
          pronominal: "",
          stative: "",
        },
      },
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["treasure"] } }],
      greekContext: { equivalents: ["θησαυροσ"] },
      inflections: {
        plural: {
          A: {
            default: ["ⲉϩⲱⲣ"],
          },
          B: {
            default: ["ⲁϩⲱⲣ"],
          },
          S: {
            default: ["ⲁϩⲱⲱⲣ"],
          },
        },
      },
    };

    const preparedDictionary = prepareDictionaryForSearch([treasureEntry]);

    expect(
      searchPreparedDictionary("ⲁϩⲱⲱⲣ", preparedDictionary, [
        treasureEntry,
      ]).map((entry) => entry.id),
    ).toEqual([7]);

    expect(
      searchPreparedDictionary("ⲉϩⲱⲣ", preparedDictionary, [treasureEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([7]);

    expect(
      searchPreparedDictionary("ⲁϩⲱⲣ", preparedDictionary, [treasureEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([7]);
  });

  it("matches entries by structured inflected forms", () => {
    const pluralOnlyEntry: DictionaryClientEntry = {
      id: 1066624037,
      headword: "ϩⲁϩ",
      etym: "Egy",
      dialects: {},
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["many, much"] } }],
      inflections: {
        feminine: {
          B: {
            default: ["ⳳⲁϩⲓ"],
          },
        },
        plural: {
          S: {
            default: ["ϩⲁϩ"],
          },
        },
      },
    };

    const preparedDictionary = prepareDictionaryForSearch([pluralOnlyEntry]);

    expect(
      searchPreparedDictionary("ϩⲁϩ", preparedDictionary, [
        pluralOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1066624037]);
    expect(
      searchPreparedDictionary("ⳳⲁϩⲓ", preparedDictionary, [
        pluralOnlyEntry,
      ]).map((entry) => entry.id),
    ).toEqual([1066624037]);
    expect(
      searchPreparedDictionary(
        "ⳳⲁϩⲓ",
        preparedDictionary,
        [pluralOnlyEntry],
        true,
      ).map((entry) => entry.id),
    ).toEqual([1066624037]);
  });

  it("matches dialect filters by structured inflected dialect coverage", () => {
    const structuredPluralEntry: DictionaryClientEntry = {
      id: 596510523,
      headword: "ϩⲁϩ",
      etym: "Egy",
      dialects: {},
      senses: [{ grammar: { pos: "N" }, meanings: { en: ["many, much"] } }],
      inflections: {
        plural: {
          S: {
            default: ["ϩⲁϩ"],
          },
        },
      },
    };
    const dictionary = [structuredPluralEntry, lordEntry];
    const preparedDictionary = prepareDictionaryForSearch(dictionary);

    expect(
      searchPreparedDictionaryPage({
        dictionary,
        limit: 10,
        preparedDictionary,
        selectedDialect: "S",
      }).entries.map((entry) => entry.id),
    ).toEqual([596510523]);
  });

  it("matches base entries by structured feminine and plural forms", () => {
    const servantEntry: DictionaryClientEntry = {
      id: 550,
      headword: "ⲃⲱⲕ",
      etym: "Egy",
      dialects: {
        B: {
          absolute: "ⲃⲱⲕ",
        },
      },
      senses: [
        {
          grammar: { gender: "M", pos: "N" },
          meanings: { en: ["servant, slave"] },
        },
      ],
      inflections: {
        feminine: {
          B: {
            default: ["ⲃⲱⲕⲓ"],
          },
        },
        plural: {
          B: {
            default: ["ⲉⲃⲓⲁⲓⲕ"],
          },
        },
      },
    };

    const preparedDictionary = prepareDictionaryForSearch([servantEntry]);

    expect(
      searchPreparedDictionary("ⲃⲱⲕⲓ", preparedDictionary, [servantEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([550]);
    expect(
      searchPreparedDictionary("ⲉⲃⲓⲁⲓⲕ", preparedDictionary, [
        servantEntry,
      ]).map((entry) => entry.id),
    ).toEqual([550]);
  });

  it("matches entries by their imperative forms", () => {
    const giveEntry: DictionaryClientEntry = {
      id: 2,
      headword: "ϯ",
      etym: "Egy",
      dialects: {
        B: {
          absolute: "ϯ",
          nominal: "ϯ-",
          pronominal: "ⲧⲏⲓ=",
          stative: "ⲧⲟⲓ†",
        },
      },
      senses: [{ grammar: { pos: "V" }, meanings: { en: ["give"] } }],
      greekContext: { equivalents: ["διδοναι"] },
      inflections: {
        imperative: {
          B: {
            absolute: ["ⲙⲟⲓ"],
          },
        },
      },
    };

    const preparedDictionary = prepareDictionaryForSearch([giveEntry]);

    expect(
      searchPreparedDictionary("ⲙⲟⲓ", preparedDictionary, [giveEntry]).map(
        (entry) => entry.id,
      ),
    ).toEqual([2]);
  });
});
