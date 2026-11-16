import { describe, expect, it } from "vitest";

import { PAGE_SECTIONS_MAP, SECTION_FIELD_KINDS, SECTION_SCHEMAS } from "@repo/contracts/cms/pages";

import { FULL_SECTION_DATA } from "./__fixtures__/section-data";
import {
  composeTranslatedSection,
  hasWrittenWord,
  isEveryWordWritten,
  isWordWritten,
  overlayWords,
} from "./section-translation";

const SECTION_KEYS = Object.values(PAGE_SECTIONS_MAP).flatMap((sections) =>
  Object.values(sections),
);
const HERO_TREE = SECTION_FIELD_KINDS["home:hero"];
const FEATURES_TREE = SECTION_FIELD_KINDS["home:whyChoose"];
const FAQ_TREE = SECTION_FIELD_KINDS["faq:content"];
const HERO_ENGLISH = FULL_SECTION_DATA["home:hero"];
const HERO_WORDS = { title: "Назва", subtitle: "Опис", buttonText: "Почати" };
const FIRST_FEATURE = { id: "strength", title: "Strength", description: "Lift", iconName: "bar" };
const SECOND_FEATURE = { id: "fitness", title: "Fitness", description: "Run", iconName: "run" };
const FIRST_FEATURE_WORDS = { ...FIRST_FEATURE, title: "Сила", description: "Вага" };
const SECOND_FEATURE_WORDS = { ...SECOND_FEATURE, title: "Форма", description: "Біг" };
const FIRST_FAQ = { question: "When?", answer: "Today" };
const SECOND_FAQ = { question: "Where?", answer: "Here" };
const FIRST_FAQ_WORDS = { question: "Коли?", answer: "Сьогодні" };
const SECOND_FAQ_WORDS = { question: "Де?", answer: "Тут" };

const makeFeatures = (features = [FIRST_FEATURE, SECOND_FEATURE]) => ({
  ...FULL_SECTION_DATA["home:whyChoose"],
  features,
});

const makeFaq = (items = [FIRST_FAQ, SECOND_FAQ]) => ({
  ...FULL_SECTION_DATA["faq:content"],
  items,
});

describe("isWordWritten", () => {
  it.each([undefined, null, 0, false, {}, [], "", " \t\n"])(
    "refuses an unwritten value %j",
    (value) => expect(isWordWritten(value)).toBe(false),
  );

  it("accepts text without trimming the stored word", () => {
    expect(isWordWritten(" Назва ")).toBe(true);
    expect(overlayWords(HERO_TREE, {}, { title: " Назва " })).toEqual({ title: " Назва " });
  });
});

describe("overlayWords", () => {
  it("takes every shared field from English whatever the source says", () => {
    const body = { ...HERO_WORDS, buttonHref: "/wrong", backgroundImage: "/wrong.jpg" };

    expect(overlayWords(HERO_TREE, HERO_ENGLISH, body)).toEqual({ ...HERO_ENGLISH, ...HERO_WORDS });
    expect(overlayWords(HERO_TREE, {}, body)).toEqual(HERO_WORDS);
    expect(
      overlayWords(SECTION_FIELD_KINDS["about:personal"], FULL_SECTION_DATA["about:personal"], {
        image: "/wrong.jpg",
        name: "Тренер",
      }),
    ).toEqual({ image: FULL_SECTION_DATA["about:personal"].image, name: "Тренер" });
  });

  it("keeps only the written words of the source", () => {
    const body = { title: "Назва", subtitle: " \t", buttonText: null, retiredTitle: "Old" };

    expect(overlayWords(HERO_TREE, HERO_ENGLISH, body)).toEqual({
      title: "Назва",
      buttonHref: HERO_ENGLISH.buttonHref,
      backgroundImage: HERO_ENGLISH.backgroundImage,
    });
  });

  it("keeps English's rows in English's order and matches feature words by row id", () => {
    const english = makeFeatures();
    const body = makeFeatures([
      { ...SECOND_FEATURE_WORDS, iconName: "wrong" },
      { ...FIRST_FEATURE_WORDS, iconName: "wrong" },
    ]);

    expect(overlayWords(FEATURES_TREE, english, body)).toEqual({
      ...body,
      features: [FIRST_FEATURE_WORDS, SECOND_FEATURE_WORDS],
    });
  });

  it("uses position when the registry names an id but the row has none", () => {
    const english = makeFeatures([{ ...FIRST_FEATURE, id: "" }]);
    const body = { features: [{ title: "Сила", description: "Вага" }] };

    expect(overlayWords(FEATURES_TREE, english, body)).toEqual({
      features: [{ ...FIRST_FEATURE_WORDS, id: "" }],
    });
  });

  it("matches the words of a list without row ids by position", () => {
    const body = makeFaq([SECOND_FAQ_WORDS, FIRST_FAQ_WORDS, FIRST_FAQ_WORDS]);

    expect(overlayWords(FAQ_TREE, makeFaq(), body)).toEqual({
      ...body,
      items: [SECOND_FAQ_WORDS, FIRST_FAQ_WORDS],
    });
    expect(composeTranslatedSection("faq:content", makeFaq(), body).isActive).toBe(true);
  });

  it("leaves unmatched English rows unwritten and saves the shorter id-less list as a draft", () => {
    const body = makeFaq([FIRST_FAQ_WORDS]);

    expect(composeTranslatedSection("faq:content", makeFaq(), body)).toEqual({
      data: { ...body, items: [FIRST_FAQ_WORDS, {}] },
      isActive: false,
    });
  });

  it("keeps positions when a source list contains a non-record row", () => {
    const body = { items: [null, SECOND_FAQ_WORDS] };

    expect(overlayWords(FAQ_TREE, makeFaq(), body)).toEqual({ items: [{}, SECOND_FAQ_WORDS] });
  });

  it("drops the words of a row English does not have", () => {
    const body = { features: [SECOND_FEATURE_WORDS] };

    expect(overlayWords(FEATURES_TREE, makeFeatures([FIRST_FEATURE]), body)).toEqual({
      features: [{ id: FIRST_FEATURE.id, iconName: FIRST_FEATURE.iconName }],
    });
    expect(
      composeTranslatedSection("home:whyChoose", makeFeatures([FIRST_FEATURE]), body).data,
    ).toEqual({});
  });

  it("keeps an empty English list and omits an absent English list", () => {
    const body = { features: [FIRST_FEATURE_WORDS] };

    expect(overlayWords(FEATURES_TREE, { features: [] }, body)).toEqual({ features: [] });
    expect(overlayWords(FEATURES_TREE, {}, body)).toEqual({});
  });

  it("overlays the words of a nested group", () => {
    const tree = SECTION_FIELD_KINDS["contact:form"];
    const english = FULL_SECTION_DATA["contact:form"];
    const body = { fieldLabels: { name: "Ім'я", contact: " " } };

    expect(overlayWords(tree, english, body)).toEqual({ fieldLabels: { name: "Ім'я" } });
    expect(overlayWords(tree, english, { fieldLabels: [] })).toEqual({});
  });
});

describe("hasWrittenWord", () => {
  it("ignores shared values and finds words inside lists and groups", () => {
    expect(hasWrittenWord(HERO_TREE, { buttonHref: "/start", title: " " })).toBe(false);
    expect(hasWrittenWord(FEATURES_TREE, { features: [{ title: "Сила" }] })).toBe(true);
    expect(
      hasWrittenWord(SECTION_FIELD_KINDS["contact:form"], { fieldLabels: { name: "Ім'я" } }),
    ).toBe(true);
    expect(hasWrittenWord(FEATURES_TREE, { features: [null, { iconName: "bar" }] })).toBe(false);
  });
});

describe("isEveryWordWritten", () => {
  it("is complete when every word with English text is written, list rows included", () => {
    const body = makeFeatures([SECOND_FEATURE_WORDS, FIRST_FEATURE_WORDS]);

    expect(isEveryWordWritten(FEATURES_TREE, makeFeatures(), body)).toBe(true);
    expect(isEveryWordWritten(HERO_TREE, HERO_ENGLISH, HERO_WORDS)).toBe(true);
  });

  it("is incomplete when one word of one row is missing", () => {
    const body = makeFeatures([FIRST_FEATURE_WORDS, { ...SECOND_FEATURE_WORDS, description: "" }]);

    expect(isEveryWordWritten(FEATURES_TREE, makeFeatures(), body)).toBe(false);
  });

  it("requires written nested English words", () => {
    const tree = SECTION_FIELD_KINDS["contact:form"];
    const english = { fieldLabels: { name: "Name" } };

    expect(isEveryWordWritten(tree, english, {})).toBe(false);
    expect(isEveryWordWritten(tree, english, { fieldLabels: { name: "Ім'я" } })).toBe(true);
  });

  it("does not require a word whose English is empty or missing", () => {
    expect(isEveryWordWritten(HERO_TREE, { title: "", subtitle: " \t" }, {})).toBe(true);
    expect(isEveryWordWritten(HERO_TREE, {}, {})).toBe(true);
    expect(isEveryWordWritten(FEATURES_TREE, { features: [] }, {})).toBe(true);
  });

  it("treats a blank word as not written", () => {
    expect(isEveryWordWritten(HERO_TREE, HERO_ENGLISH, { ...HERO_WORDS, title: " \n" })).toBe(
      false,
    );
  });
});

describe("composeTranslatedSection", () => {
  it("stores {} when no word is written", () => {
    const body = { title: " \t", buttonHref: "/start", backgroundImage: "/bg.jpg" };

    expect(composeTranslatedSection("home:hero", HERO_ENGLISH, body)).toEqual({
      data: {},
      isActive: false,
    });
    expect(composeTranslatedSection("home:hero", HERO_ENGLISH, {})).toEqual({
      data: {},
      isActive: false,
    });
  });

  it("is active only when every word is written", () => {
    expect(composeTranslatedSection("home:hero", HERO_ENGLISH, { title: "Назва" })).toEqual({
      data: {
        title: "Назва",
        buttonHref: HERO_ENGLISH.buttonHref,
        backgroundImage: HERO_ENGLISH.backgroundImage,
      },
      isActive: false,
    });
    expect(composeTranslatedSection("home:hero", HERO_ENGLISH, HERO_WORDS)).toEqual({
      data: { ...HERO_ENGLISH, ...HERO_WORDS },
      isActive: true,
    });
  });

  it("is vacuously complete when English has no written words", () => {
    expect(composeTranslatedSection("home:hero", {}, {})).toEqual({ data: {}, isActive: true });
    expect(composeTranslatedSection("home:hero", {}, { title: "Назва" })).toEqual({
      data: { title: "Назва" },
      isActive: true,
    });
  });

  it.each(SECTION_KEYS)("composes data its section schema accepts for %s", (section) => {
    const english = FULL_SECTION_DATA[section];
    const row = composeTranslatedSection(section, english, english);

    expect(SECTION_SCHEMAS[section].parse(row.data)).toEqual(english);
    expect(row.isActive).toBe(true);
  });
});
