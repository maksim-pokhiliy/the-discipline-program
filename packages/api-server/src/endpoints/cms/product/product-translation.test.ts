import { describe, expect, it } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { type ProductTranslationWords } from "@repo/contracts/cms/product";

import { type EnglishWords } from "./english-words";
import {
  alignTranslationWords,
  composeProductTranslation,
  productTranslationState,
} from "./product-translation";

const FIRST = { id: "first", text: "First English feature" };
const SECOND = { id: "second", text: "Second English feature" };
const FIRST_WORD = { id: FIRST.id, text: "First translated feature" };
const SECOND_WORD = { id: SECOND.id, text: "Second translated feature" };
const ENGLISH: EnglishWords = {
  title: "English title",
  description: "English description",
  features: [FIRST, SECOND],
};
const WORDS: ProductTranslationWords = {
  title: "  Translated title  ",
  description: "Translated description",
  features: [SECOND_WORD, FIRST_WORD],
};
const NEW_FEATURE = { id: "new", text: "Added English feature" };
const ROW_UPDATED_AT = new Date("2026-11-01T10:00:00.000Z");
const OLDER_UPDATED_AT = new Date("2026-10-31T10:00:00.000Z");
const NEWER_UPDATED_AT = new Date("2026-11-02T10:00:00.000Z");

describe("composeProductTranslation", () => {
  it("takes the English ids and order and matches the words by id", () => {
    const before = structuredClone({ english: ENGLISH, words: WORDS });

    expect(composeProductTranslation(ENGLISH, WORDS)).toEqual({
      title: WORDS.title,
      description: WORDS.description,
      featureList: [FIRST_WORD, SECOND_WORD],
      isActive: true,
    });
    expect({ english: ENGLISH, words: WORDS }).toEqual(before);
  });

  it("drops the word of a feature English no longer has and leaves a new one empty", () => {
    const english = { ...ENGLISH, features: [SECOND, NEW_FEATURE] };

    expect(composeProductTranslation(english, WORDS)).toEqual({
      title: WORDS.title,
      description: WORDS.description,
      featureList: [SECOND_WORD, { id: NEW_FEATURE.id, text: "" }],
      isActive: false,
    });
  });

  it.each(["", " \t\n"])("returns null when no word is written, including %j", (text) => {
    const words = {
      title: text,
      description: text,
      features: ENGLISH.features.map(({ id }) => ({ id, text })),
    };

    expect(composeProductTranslation(ENGLISH, words)).toBeNull();
  });

  it("returns null when the only written word belongs to a removed feature", () => {
    const words = {
      title: "",
      description: "",
      features: [{ id: "removed", text: "Discarded translation" }],
    };

    expect(composeProductTranslation(ENGLISH, words)).toBeNull();
  });

  it.each([
    { name: "missing word", features: [FIRST_WORD] },
    { name: "empty word", features: [FIRST_WORD, { ...SECOND_WORD, text: "" }] },
    { name: "white-space word", features: [FIRST_WORD, { ...SECOND_WORD, text: " \t" }] },
  ])("is a draft with a $name for a written English word", ({ features }) => {
    expect(composeProductTranslation(ENGLISH, { ...WORDS, features })?.isActive).toBe(false);
  });

  it("is live when a blank English feature has no translated word", () => {
    const blank = { id: "blank", text: " \t\n" };
    const english = { ...ENGLISH, features: [...ENGLISH.features, blank] };

    expect(composeProductTranslation(english, WORDS)).toEqual({
      title: WORDS.title,
      description: WORDS.description,
      featureList: [FIRST_WORD, SECOND_WORD, { id: blank.id, text: "" }],
      isActive: true,
    });
  });

  it.each([
    { name: "title", title: "", description: WORDS.description },
    { name: "white-space title", title: " \t", description: WORDS.description },
    { name: "description", title: WORDS.title, description: "" },
    { name: "white-space description", title: WORDS.title, description: " \t" },
  ])(
    "keeps the $name required for a live translation even when English is blank",
    ({ title, description }) => {
      const english = { ...ENGLISH, title: "", description: " \t" };

      expect(composeProductTranslation(english, { ...WORDS, title, description })?.isActive).toBe(
        false,
      );
    },
  );
});

describe("alignTranslationWords", () => {
  it("lines the stored words up with the current English", () => {
    const english = { ...ENGLISH, features: [SECOND, NEW_FEATURE, FIRST] };
    const row = {
      title: WORDS.title,
      description: WORDS.description,
      featureList: [...WORDS.features, { id: "removed", text: "Discarded word" }],
    };
    const before = structuredClone(row);

    expect(alignTranslationWords(english, row)).toEqual({
      title: WORDS.title,
      description: WORDS.description,
      features: [SECOND_WORD, { id: NEW_FEATURE.id, text: "" }, FIRST_WORD],
    });
    expect(row).toEqual(before);
  });

  it("gives empty words without a row", () => {
    expect(alignTranslationWords(ENGLISH, null)).toEqual({
      title: "",
      description: "",
      features: ENGLISH.features.map(({ id }) => ({ id, text: "" })),
    });
  });
});

describe("productTranslationState", () => {
  it("returns NOT_TRANSLATED without a row", () => {
    expect(productTranslationState(null, NEWER_UPDATED_AT)).toBe(TranslationState.NOT_TRANSLATED);
  });

  it("returns DRAFT for an inactive row, before ENGLISH_NEWER", () => {
    expect(
      productTranslationState({ isActive: false, updatedAt: ROW_UPDATED_AT }, NEWER_UPDATED_AT),
    ).toBe(TranslationState.DRAFT);
  });

  it("returns ENGLISH_NEWER when the English words are later than the row", () => {
    expect(
      productTranslationState({ isActive: true, updatedAt: ROW_UPDATED_AT }, NEWER_UPDATED_AT),
    ).toBe(TranslationState.ENGLISH_NEWER);
  });

  it.each([OLDER_UPDATED_AT, ROW_UPDATED_AT])(
    "returns TRANSLATED otherwise for %s",
    (wordsUpdatedAt) => {
      expect(
        productTranslationState({ isActive: true, updatedAt: ROW_UPDATED_AT }, wordsUpdatedAt),
      ).toBe(TranslationState.TRANSLATED);
    },
  );
});
