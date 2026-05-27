import {
  grammarLesson01ConceptIds,
  grammarLesson01Id,
  grammarLesson01SourceIds,
} from "../lesson-01-ids.ts";

import type { GrammarFlashcardSeedDocument } from "../../schema.ts";

const lessonId = grammarLesson01Id;
const lessonSlug = "lesson-1";
const definitionsSectionId = `${lessonId}.section.definitions`;
const zeroDeterminationSectionId = `${lessonId}.section.zero-determination`;
const nominalSentenceSectionId = `${lessonId}.section.bipartite-nominal-sentence`;
const sourceRefs = [grammarLesson01SourceIds.forthcomingBasisgrammatica];

export const grammarLesson01FlashcardSeeds: readonly GrammarFlashcardSeedDocument[] =
  [
    {
      id: "grammar.flashcard.lesson01.bare-noun.definition",
      lessonId,
      lessonSlug,
      sectionId: definitionsSectionId,
      template: "grammar_concept_to_definition",
      category: "concept",
      frontKind: "grammar",
      backKind: "text",
      front: {
        en: "Bare noun",
        nl: "Naakt naamwoord",
      },
      back: {
        en: "A noun used without an article, demonstrative, or possessive.",
        nl: "Een naamwoord zonder lidwoord, aanwijzend woord of possessief.",
      },
      context: {
        en: "Lesson 1 defines bare nouns before contrasting them with determined nouns.",
        nl: "Les 1 definieert naakte naamwoorden voordat ze met bepaalde naamwoorden worden vergeleken.",
      },
      focus: {
        en: "Noun class",
        nl: "Naamwoordklasse",
      },
      hint: {
        en: "Look for what is absent before the noun.",
        nl: "Let op wat voor het naamwoord ontbreekt.",
      },
      conceptRefs: [grammarLesson01ConceptIds.bareNoun],
      sourceRefs,
      tags: ["lesson-1", "concept", "noun"],
    },
    {
      id: "grammar.flashcard.lesson01.determined-noun.definition",
      lessonId,
      lessonSlug,
      sectionId: definitionsSectionId,
      template: "grammar_concept_to_definition",
      category: "concept",
      frontKind: "grammar",
      backKind: "text",
      front: {
        en: "Determined noun",
        nl: "Bepaald naamwoord",
      },
      back: {
        en: "A noun introduced by a determiner such as an article, demonstrative, or possessive.",
        nl: "Een naamwoord ingeleid door een determinator zoals een lidwoord, aanwijzend woord of possessief.",
      },
      context: {
        en: "Lesson 1 treats determination as a core noun-phrase contrast.",
        nl: "Les 1 behandelt bepaaldheid als een kerncontrast binnen de naamwoordgroep.",
      },
      focus: {
        en: "Determination",
        nl: "Bepaaldheid",
      },
      hint: {
        en: "Think of the word that marks the noun as specific.",
        nl: "Denk aan het woord dat het naamwoord als specifiek markeert.",
      },
      conceptRefs: [grammarLesson01ConceptIds.determinedNoun],
      sourceRefs,
      tags: ["lesson-1", "concept", "determiner"],
    },
    {
      id: "grammar.flashcard.lesson01.zero-determination.definition",
      lessonId,
      lessonSlug,
      sectionId: zeroDeterminationSectionId,
      template: "grammar_concept_to_definition",
      category: "concept",
      frontKind: "grammar",
      backKind: "text",
      front: {
        en: "Zero determination",
        nl: "Nulbepaaldheid",
      },
      back: {
        en: "A bare noun phrase where the lack of a determiner is meaningful, often with expressions such as 'every'.",
        nl: "Een naakte naamwoordgroep waarbij het ontbreken van een determinator betekenis draagt, vaak bij uitdrukkingen zoals 'ieder'.",
      },
      context: {
        en: "Lesson 1 uses Ø- before nouns to show zero determination in examples.",
        nl: "Les 1 gebruikt Ø- voor naamwoorden om nulbepaaldheid in voorbeelden te tonen.",
      },
      focus: {
        en: "Zero marker",
        nl: "Nulmarkering",
      },
      hint: {
        en: "The Ø- marks that no visible determiner is present.",
        nl: "De Ø- geeft aan dat er geen zichtbare determinator staat.",
      },
      conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
      sourceRefs,
      tags: ["lesson-1", "concept", "zero-determination"],
    },
    {
      id: "grammar.flashcard.lesson01.nexus-pronouns.definition",
      lessonId,
      lessonSlug,
      sectionId: nominalSentenceSectionId,
      template: "grammar_concept_to_definition",
      category: "concept",
      frontKind: "grammar",
      backKind: "text",
      front: {
        en: "Nexus pronouns",
        nl: "Nexuspronomina",
      },
      back: {
        en: "The linking pronouns ⲡⲉ, ⲧⲉ, and ⲛⲉ used in the bipartite nominal sentence.",
        nl: "De verbindende pronomina ⲡⲉ, ⲧⲉ en ⲛⲉ in de bipartiete nominale zin.",
      },
      context: {
        en: "Lesson 1 introduces nexus pronouns as the subject element of basic nominal sentences.",
        nl: "Les 1 introduceert nexuspronomina als het subjectselement van basisnominale zinnen.",
      },
      focus: {
        en: "Nominal sentence",
        nl: "Nominale zin",
      },
      hint: {
        en: "Recall the three short pronouns after the predicate.",
        nl: "Denk aan de drie korte pronomina na het predicaat.",
      },
      conceptRefs: [grammarLesson01ConceptIds.nexusPronouns],
      sourceRefs,
      tags: ["lesson-1", "concept", "nominal-sentence"],
    },
    {
      id: "grammar.flashcard.lesson01.nominal-sentence.definition",
      lessonId,
      lessonSlug,
      sectionId: nominalSentenceSectionId,
      template: "grammar_concept_to_definition",
      category: "concept",
      frontKind: "grammar",
      backKind: "text",
      front: {
        en: "Bipartite nominal sentence",
        nl: "Bipartiete nominale zin",
      },
      back: {
        en: "A nominal sentence built from a predicate phrase plus a nexus pronoun, without a present-tense verb 'to be'.",
        nl: "Een nominale zin met een predicaatsgroep plus een nexuspronomen, zonder een tegenwoordige-tijdswerkwoord 'zijn'.",
      },
      context: {
        en: "Lesson 1 presents the pattern with examples such as Ⲟⲩⲓⲱⲧ ⲡⲉ.",
        nl: "Les 1 presenteert het patroon met voorbeelden zoals Ⲟⲩⲓⲱⲧ ⲡⲉ.",
      },
      focus: {
        en: "Syntax pattern",
        nl: "Zinspatroon",
      },
      hint: {
        en: "There are two main parts: predicate and nexus pronoun.",
        nl: "Er zijn twee hoofddelen: predicaat en nexuspronomen.",
      },
      conceptRefs: [grammarLesson01ConceptIds.bipartiteNominalSentence],
      sourceRefs,
      tags: ["lesson-1", "concept", "nominal-sentence"],
    },
    {
      id: "grammar.flashcard.lesson01.zero-determination.every-man",
      lessonId,
      lessonSlug,
      sectionId: zeroDeterminationSectionId,
      template: "grammar_coptic_to_translation",
      category: "example",
      frontKind: "coptic",
      backKind: "meaning",
      front: {
        en: "Ø-ⲣⲱⲙⲓ ⲛⲓⲃⲉⲛ",
        nl: "Ø-ⲣⲱⲙⲓ ⲛⲓⲃⲉⲛ",
      },
      back: {
        en: "every man",
        nl: "iedere mens",
      },
      context: {
        en: "Zero determination example from Lesson 1.",
        nl: "Voorbeeld van nulbepaaldheid uit Les 1.",
      },
      focus: {
        en: "Zero determination",
        nl: "Nulbepaaldheid",
      },
      hint: {
        en: "ⲛⲓⲃⲉⲛ gives the sense of 'every'.",
        nl: "ⲛⲓⲃⲉⲛ geeft de betekenis 'ieder'.",
      },
      conceptRefs: [grammarLesson01ConceptIds.zeroDetermination],
      exampleRef: "grammar.example.lesson01.zero-determination.001",
      sourceRefs,
      tags: ["lesson-1", "example", "zero-determination"],
    },
    {
      id: "grammar.flashcard.lesson01.nominal-sentence.he-is-father",
      lessonId,
      lessonSlug,
      sectionId: nominalSentenceSectionId,
      template: "grammar_coptic_to_translation",
      category: "example",
      frontKind: "coptic",
      backKind: "meaning",
      front: {
        en: "Ⲟⲩⲓⲱⲧ ⲡⲉ.",
        nl: "Ⲟⲩⲓⲱⲧ ⲡⲉ.",
      },
      back: {
        en: "He is a father.",
        nl: "Hij is een vader.",
      },
      context: {
        en: "Bipartite nominal sentence example from Lesson 1.",
        nl: "Voorbeeld van een bipartiete nominale zin uit Les 1.",
      },
      focus: {
        en: "Nexus pronoun ⲡⲉ",
        nl: "Nexuspronomen ⲡⲉ",
      },
      hint: {
        en: "ⲡⲉ marks the masculine singular subject.",
        nl: "ⲡⲉ markeert het mannelijk enkelvoudig subject.",
      },
      conceptRefs: [
        grammarLesson01ConceptIds.bipartiteNominalSentence,
        grammarLesson01ConceptIds.nexusPronouns,
      ],
      exampleRef: "grammar.example.lesson01.nominal-sentence.001",
      sourceRefs,
      tags: ["lesson-1", "example", "nominal-sentence"],
    },
    {
      id: "grammar.flashcard.lesson01.nominal-sentence.they-are-men",
      lessonId,
      lessonSlug,
      sectionId: nominalSentenceSectionId,
      template: "grammar_translation_to_coptic",
      category: "example",
      frontKind: "meaning",
      backKind: "coptic",
      front: {
        en: "They are men.",
        nl: "Het zijn mannen.",
      },
      back: {
        en: "Ϩⲁⲛⲣⲱⲙⲓ ⲛⲉ.",
        nl: "Ϩⲁⲛⲣⲱⲙⲓ ⲛⲉ.",
      },
      context: {
        en: "Bipartite nominal sentence example from Lesson 1.",
        nl: "Voorbeeld van een bipartiete nominale zin uit Les 1.",
      },
      focus: {
        en: "Nexus pronoun ⲛⲉ",
        nl: "Nexuspronomen ⲛⲉ",
      },
      hint: {
        en: "Use the plural nexus pronoun.",
        nl: "Gebruik het meervoudige nexuspronomen.",
      },
      conceptRefs: [
        grammarLesson01ConceptIds.bipartiteNominalSentence,
        grammarLesson01ConceptIds.nexusPronouns,
      ],
      exampleRef: "grammar.example.lesson01.nominal-sentence.007",
      sourceRefs,
      tags: ["lesson-1", "example", "nominal-sentence"],
    },
  ] as const;
