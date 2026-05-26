import { describe, expect, it } from "vitest";

import type { PerLimbDistribution } from "@repo/contracts/lms/_shared";

import { formatSide } from "./format-side";

describe("formatSide", () => {
  describe("each_leg kind", () => {
    it("renders '<count> each leg' when countPerLimb is set", () => {
      const s: PerLimbDistribution = { kind: "each_leg", countPerLimb: 8 };

      expect(formatSide(s)).toBe("8 each leg");
    });

    it("renders 'each leg' when countPerLimb is omitted", () => {
      const s: PerLimbDistribution = { kind: "each_leg" };

      expect(formatSide(s)).toBe("each leg");
    });
  });

  describe("each_arm kind", () => {
    it("renders '<count> each arm' when countPerLimb is set", () => {
      const s: PerLimbDistribution = { kind: "each_arm", countPerLimb: 10 };

      expect(formatSide(s)).toBe("10 each arm");
    });

    it("renders 'each arm' when countPerLimb is omitted", () => {
      const s: PerLimbDistribution = { kind: "each_arm" };

      expect(formatSide(s)).toBe("each arm");
    });
  });

  describe("explicit_split kind", () => {
    it("renders 'L' for left side", () => {
      const s: PerLimbDistribution = { kind: "explicit_split", side: "left" };

      expect(formatSide(s)).toBe("L");
    });

    it("renders 'R' for right side", () => {
      const s: PerLimbDistribution = { kind: "explicit_split", side: "right" };

      expect(formatSide(s)).toBe("R");
    });
  });

  describe("alternating kind", () => {
    it("renders 'alt.' when sourceAnnotation is omitted", () => {
      const s: PerLimbDistribution = { kind: "alternating" };

      expect(formatSide(s)).toBe("alt.");
    });

    it("renders 'alt. (<annotation>)' when sourceAnnotation is set", () => {
      const s: PerLimbDistribution = {
        kind: "alternating",
        sourceAnnotation: "alt-source",
      };

      expect(formatSide(s)).toBe("alt. (alt-source)");
    });
  });
});
