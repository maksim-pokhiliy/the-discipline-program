import { describe, expect, it } from "vitest";

import {
  REST_DURATION_UNITS,
  REST_SCOPES,
  type RestSpec,
  restSpecSchema,
} from "@repo/contracts/lms/_shared";

import { formatRestRaw } from "./format-rest-raw";

const durationForUnit = (unit: RestSpec["duration"]["unit"]): RestSpec["duration"] => {
  if (unit === "range_sec" || unit === "range_min") {
    return { value: 60, unit, rangeMax: 90 };
  }

  return { value: 90, unit };
};

const CROSS_PRODUCT_FIXTURES: { name: string; parsed: RestSpec }[] = REST_DURATION_UNITS.flatMap(
  (unit) =>
    REST_SCOPES.map((scope) => ({
      name: `${unit} × ${scope}`,
      parsed: { duration: durationForUnit(unit), scope },
    })),
);

describe("formatRestRaw", () => {
  it.each(CROSS_PRODUCT_FIXTURES)(
    "returns a non-empty contract-valid string for the $name fixture",
    ({ parsed }) => {
      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed).length).toBeGreaterThan(0);
    },
  );

  describe("duration segment", () => {
    it("renders seconds for the sec unit", () => {
      const parsed: RestSpec = { duration: { value: 90, unit: "sec" }, scope: "between_sets" };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("90 sec");
    });

    it("renders minutes for the min unit", () => {
      const parsed: RestSpec = { duration: { value: 3, unit: "min" }, scope: "between_rounds" };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("3 min");
    });

    it("renders a seconds range for the range_sec unit", () => {
      const parsed: RestSpec = {
        duration: { value: 60, unit: "range_sec", rangeMax: 90 },
        scope: "between_intervals",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("60-90 sec");
    });

    it("renders a minutes range for the range_min unit", () => {
      const parsed: RestSpec = {
        duration: { value: 1, unit: "range_min", rangeMax: 3 },
        scope: "between_rounds",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("1-3 min");
    });
  });

  describe("scope segment", () => {
    it("renders the between-sets phrase", () => {
      const parsed: RestSpec = { duration: { value: 90, unit: "sec" }, scope: "between_sets" };

      expect(formatRestRaw(parsed)).toContain("between sets");
    });

    it("renders the between-rounds phrase", () => {
      const parsed: RestSpec = { duration: { value: 90, unit: "sec" }, scope: "between_rounds" };

      expect(formatRestRaw(parsed)).toContain("between rounds");
    });

    it("renders the between-intervals phrase", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "between_intervals",
      };

      expect(formatRestRaw(parsed)).toContain("between intervals");
    });

    it("starts every result with the rest prefix", () => {
      const parsed: RestSpec = { duration: { value: 90, unit: "sec" }, scope: "between_sets" };

      expect(formatRestRaw(parsed).startsWith("rest")).toBe(true);
    });
  });

  describe("setIndex segment", () => {
    it("appends the set number for after_specific_set with a setIndex", () => {
      const parsed: RestSpec = {
        duration: { value: 45, unit: "sec" },
        scope: "after_specific_set",
        setIndex: 3,
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("after set 3");
    });

    it("degrades to the bare scope phrase for after_specific_set without a setIndex", () => {
      const parsed: RestSpec = {
        duration: { value: 45, unit: "sec" },
        scope: "after_specific_set",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);

      const out = formatRestRaw(parsed);

      expect(out).toContain("after set");
      expect(out.length).toBeGreaterThan(0);
    });

    it("appends the set number for a non-after_specific_set scope when setIndex is present", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "between_sets",
        setIndex: 2,
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("between sets 2");
    });
  });

  describe("qualifier segment", () => {
    it("renders the until-recovery qualifier", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "between_sets",
        qualifier: "until_recovery",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("(until recovery)");
    });

    it("renders the fixed qualifier", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "between_sets",
        qualifier: "fixed",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("(fixed)");
    });

    it("renders the range qualifier", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "between_sets",
        qualifier: "range",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toContain("(range)");
    });
  });

  describe("optional-field combinations", () => {
    it("renders neither setIndex nor qualifier for the minimal fixture", () => {
      const parsed: RestSpec = { duration: { value: 90, unit: "sec" }, scope: "between_sets" };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toBe("rest 90 sec between sets");
    });

    it("renders both setIndex and qualifier together", () => {
      const parsed: RestSpec = {
        duration: { value: 90, unit: "sec" },
        scope: "after_specific_set",
        setIndex: 2,
        qualifier: "fixed",
      };

      expect(restSpecSchema.safeParse(parsed).success).toBe(true);
      expect(formatRestRaw(parsed)).toBe("rest 90 sec after set 2 (fixed)");
    });
  });
});
