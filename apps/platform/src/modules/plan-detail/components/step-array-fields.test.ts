import { describe, expect, it } from "vitest";

import { coerceStepValue } from "./step-array-fields";

const PASS_THROUGH_CASES: { raw: string; expected: number }[] = [
  { raw: "1", expected: 1 },
  { raw: "21", expected: 21 },
  { raw: "999", expected: 999 },
  { raw: "  7  ", expected: 7 },
];

const TRUNCATION_CASES: { name: string; raw: string; expected: number }[] = [
  { name: "leading zero", raw: "007", expected: 7 },
  { name: "leading plus sign", raw: "+5", expected: 5 },
  { name: "padded plus sign", raw: "  +5  ", expected: 5 },
  { name: "decimal", raw: "5.5", expected: 5 },
  { name: "zero-decimal", raw: "5.0", expected: 5 },
  { name: "scientific notation tail", raw: "1e3", expected: 1 },
  { name: "trailing letters", raw: "12abc", expected: 12 },
];

const CLAMPED_TO_ZERO_CASES: { name: string; raw: string }[] = [
  { name: "hexadecimal", raw: "0x10" },
  { name: "binary", raw: "0b101" },
  { name: "negative number", raw: "-3" },
  { name: "explicit zero", raw: "0" },
  { name: "empty string", raw: "" },
  { name: "whitespace only", raw: "   " },
  { name: "non-numeric text", raw: "abc" },
  { name: "Infinity literal", raw: "Infinity" },
  { name: "NaN literal", raw: "NaN" },
];

describe("coerceStepValue", () => {
  describe("passes a plain positive-integer literal through unchanged", () => {
    it.each(PASS_THROUGH_CASES)("coerces $raw to its integer value", ({ raw, expected }) => {
      expect(coerceStepValue(raw)).toBe(expected);
    });
  });

  describe("truncates to the leading base-10 integer", () => {
    it.each(TRUNCATION_CASES)("coerces $name ($raw) to $expected", ({ raw, expected }) => {
      expect(coerceStepValue(raw)).toBe(expected);
    });
  });

  describe("clamps every non-positive or unparseable input to zero", () => {
    it.each(CLAMPED_TO_ZERO_CASES)("returns 0 for $name ($raw)", ({ raw }) => {
      expect(coerceStepValue(raw)).toBe(0);
    });
  });
});
