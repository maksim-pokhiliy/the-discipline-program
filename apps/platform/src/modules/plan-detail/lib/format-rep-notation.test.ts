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
    it("renders bare 'max' when no tail is set", () => {
      const r: RepNotation = { kind: "max" };

      expect(formatRepNotation(r)).toBe("max");
    });

    it("appends the tail after 'max ' when set", () => {
      const r: RepNotation = { kind: "max", tail: "in remaining time" };

      expect(formatRepNotation(r)).toBe("max in remaining time");
    });
  });
});
