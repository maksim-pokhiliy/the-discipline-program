import { describe, expect, it } from "vitest";

import { type ProductTranslationWords } from "@repo/contracts/cms/product";

import { hasProductTranslationWords } from "./product-translation-words";

const EMPTY: ProductTranslationWords = { title: "", description: "", features: [] };

describe("hasProductTranslationWords", () => {
  it("recognizes empty words and whitespace as a clear", () => {
    expect(hasProductTranslationWords(EMPTY)).toBe(false);
    expect(
      hasProductTranslationWords({
        title: " \n",
        description: "\t",
        features: [{ id: "a", text: " " }],
      }),
    ).toBe(false);
  });

  it.each(["title", "description"])("recognizes a written %s", (field) => {
    expect(hasProductTranslationWords({ ...EMPTY, [field]: " Written word " })).toBe(true);
  });

  it("recognizes a feature's word without treating its id as a word", () => {
    expect(hasProductTranslationWords({ ...EMPTY, features: [{ id: "a", text: "" }] })).toBe(false);
    expect(
      hasProductTranslationWords({ ...EMPTY, features: [{ id: "a", text: "Written feature" }] }),
    ).toBe(true);
  });
});
