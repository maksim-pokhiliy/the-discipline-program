import { describe, expect, it } from "vitest";

import { type EnglishWords, haveEnglishWordsChanged } from "./english-words";

const FIRST = { id: "first", text: "First English feature" };
const SECOND = { id: "second", text: "Second English feature" };
const ENGLISH: EnglishWords = {
  title: "English title",
  description: "English description",
  features: [FIRST, SECOND],
};

describe("haveEnglishWordsChanged", () => {
  it("returns false for the same words", () => {
    expect(haveEnglishWordsChanged(ENGLISH, structuredClone(ENGLISH))).toBe(false);
  });

  it.each([
    { name: "title", after: { ...ENGLISH, title: "Changed title" } },
    { name: "description", after: { ...ENGLISH, description: "Changed description" } },
    {
      name: "feature text",
      after: { ...ENGLISH, features: [{ ...FIRST, text: "Changed feature" }, SECOND] },
    },
  ])("returns true for a changed $name", ({ after }) => {
    expect(haveEnglishWordsChanged(ENGLISH, after)).toBe(true);
  });

  it.each([
    { name: "feature id", features: [{ ...FIRST, id: "changed-id" }, SECOND] },
    { name: "move", features: [SECOND, FIRST] },
    { name: "added feature", features: [FIRST, SECOND, { id: "third", text: "Added" }] },
    { name: "removed feature", features: [FIRST] },
  ])("returns true for a $name", ({ features }) => {
    expect(haveEnglishWordsChanged(ENGLISH, { ...ENGLISH, features })).toBe(true);
  });
});
