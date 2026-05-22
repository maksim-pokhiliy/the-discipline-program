import { describe, expect, it } from "vitest";

import { parseStepDraft } from "./step-array-fields";

const ACCEPT_CASES: { draft: string; expected: number }[] = [
  { draft: "1", expected: 1 },
  { draft: "21", expected: 21 },
  { draft: "999", expected: 999 },
  { draft: "  7  ", expected: 7 },
];

const REJECT_CASES: { name: string; draft: string }[] = [
  { name: "scientific notation", draft: "1e3" },
  { name: "hexadecimal", draft: "0x10" },
  { name: "binary", draft: "0b101" },
  { name: "leading plus sign", draft: "+5" },
  { name: "negative number", draft: "-3" },
  { name: "leading zero", draft: "007" },
  { name: "decimal", draft: "5.5" },
  { name: "zero-decimal", draft: "5.0" },
  { name: "zero", draft: "0" },
  { name: "empty string", draft: "" },
  { name: "whitespace only", draft: "   " },
  { name: "non-numeric text", draft: "abc" },
  { name: "padded invalid sign", draft: "  +5  " },
  { name: "Infinity literal", draft: "Infinity" },
  { name: "NaN literal", draft: "NaN" },
];

describe("parseStepDraft", () => {
  describe("accepts a plain positive-integer literal", () => {
    it.each(ACCEPT_CASES)("parses $draft to its integer value", ({ draft, expected }) => {
      expect(parseStepDraft(draft)).toBe(expected);
    });
  });

  describe("rejects every input the permissive Number() coercion used to accept", () => {
    it.each(REJECT_CASES)("returns null for $name ($draft)", ({ draft }) => {
      expect(parseStepDraft(draft)).toBe(null);
    });
  });
});
