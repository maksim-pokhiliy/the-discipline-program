import { describe, expect, it } from "vitest";

import { buildIntensityCandidate } from "./schema-form-utils";

describe("buildIntensityCandidate strips undefined axes", () => {
  it("returns an empty object when every axis is undefined", () => {
    expect(buildIntensityCandidate({})).toEqual({});
  });

  it("includes only the axes that are defined", () => {
    expect(buildIntensityCandidate({ rpe: { value: 8 }, pace: undefined })).toEqual({
      rpe: { value: 8 },
    });
  });

  it("preserves every axis when all are set", () => {
    const candidate = buildIntensityCandidate({
      effortPercent: { value: 80 },
      rpe: { value: 8 },
      pace: "moderate",
      hrZone: { zone: "Z2" },
      numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
    });

    expect(candidate).toEqual({
      effortPercent: { value: 80 },
      rpe: { value: 8 },
      pace: "moderate",
      hrZone: { zone: "Z2" },
      numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
    });
  });
});
