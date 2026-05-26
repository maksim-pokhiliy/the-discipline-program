import { describe, expect, it } from "vitest";

import type { RepNotation } from "@repo/contracts/lms/_shared";

import { formatRepNotation } from "./format-rep-notation";

describe("formatRepNotation", () => {
  describe("count kind", () => {
    it("renders '<value> reps'", () => {
      const r: RepNotation = { kind: "count", value: 5 };

      expect(formatRepNotation(r)).toBe("5 reps");
    });
  });

  describe("range kind", () => {
    it("renders '<min>–<max> reps' with EN DASH", () => {
      const r: RepNotation = { kind: "range", min: 6, max: 10 };

      expect(formatRepNotation(r)).toBe("6–10 reps");
    });
  });

  describe("unit_bound kind", () => {
    it("renders '<value> <unit>' when value is set", () => {
      const r: RepNotation = { kind: "unit_bound", unit: "sec", value: 30 };

      expect(formatRepNotation(r)).toBe("30 sec");
    });

    it("renders '<min>–<max> <unit>' when range is set", () => {
      const r: RepNotation = {
        kind: "unit_bound",
        unit: "min",
        range: { min: 2, max: 5 },
      };

      expect(formatRepNotation(r)).toBe("2–5 min");
    });

    it("falls back to bare unit when neither value nor range is set", () => {
      const r: RepNotation = { kind: "unit_bound", unit: "km" };

      expect(formatRepNotation(r)).toBe("km");
    });
  });

  describe("max kind", () => {
    it("renders 'max' for bare subForm", () => {
      const r: RepNotation = { kind: "max", subForm: "bare" };

      expect(formatRepNotation(r)).toBe("max");
    });

    it("renders 'max (in remaining time)' for in_remaining_time subForm", () => {
      const r: RepNotation = { kind: "max", subForm: "in_remaining_time" };

      expect(formatRepNotation(r)).toBe("max (in remaining time)");
    });

    it("renders 'max · progressive' for progressive subForm without seed", () => {
      const r: RepNotation = { kind: "max", subForm: "progressive" };

      expect(formatRepNotation(r)).toBe("max · progressive");
    });

    it("appends seed in parentheses for progressive subForm with seed", () => {
      const r: RepNotation = {
        kind: "max",
        subForm: "progressive",
        progressiveSeed: "5RM",
      };

      expect(formatRepNotation(r)).toBe("max · progressive (5RM)");
    });
  });

  describe("implicit kind", () => {
    it("renders 'implicit'", () => {
      const r: RepNotation = { kind: "implicit" };

      expect(formatRepNotation(r)).toBe("implicit");
    });
  });

  describe("total_flag kind", () => {
    it("renders 'total <value>'", () => {
      const r: RepNotation = { kind: "total_flag", value: 100 };

      expect(formatRepNotation(r)).toBe("total 100");
    });
  });

  describe("compound_rep_unit kind", () => {
    it("renders 'compound rep'", () => {
      const r: RepNotation = { kind: "compound_rep_unit" };

      expect(formatRepNotation(r)).toBe("compound rep");
    });
  });
});
