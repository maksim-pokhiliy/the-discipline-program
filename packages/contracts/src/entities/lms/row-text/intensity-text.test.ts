import { describe, expect, it } from "vitest";

import { type Intensity } from "../_shared";

import { buildEffectiveIntensityTexts, buildIntensityTexts } from "./intensity-text";
import { resolveIntensity } from "./resolve-intensity";

describe("buildIntensityTexts", () => {
  it("returns an empty list for null intensity", () => {
    expect(buildIntensityTexts(null)).toEqual([]);
  });

  it("renders a single effort-percent value", () => {
    const intensity: Intensity = { effortPercent: { value: 85 } };

    expect(buildIntensityTexts(intensity)).toEqual([
      { dimension: "effortPercent", text: "EFFORT 85%" },
    ]);
  });

  it("renders an effort-percent range", () => {
    const intensity: Intensity = { effortPercent: { range: { min: 70, max: 80 } } };

    expect(buildIntensityTexts(intensity)).toEqual([
      { dimension: "effortPercent", text: "EFFORT 70–80%" },
    ]);
  });

  it("renders rpe, pace, hr zone and numeric pace in dimension order", () => {
    const intensity: Intensity = {
      rpe: { value: 8 },
      pace: "easy",
      hrZone: { zone: "Z3" },
      numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
    };

    expect(buildIntensityTexts(intensity)).toEqual([
      { dimension: "rpe", text: "RPE 8" },
      { dimension: "pace", text: "PACE · EASY" },
      { dimension: "hrZone", text: "HR Z3" },
      { dimension: "numericPace", text: "5:00 / km" },
    ]);
  });
});

describe("buildEffectiveIntensityTexts", () => {
  it("marks a dimension inherited when it resolves above the queried level", () => {
    const resolved = resolveIntensity({ effortPercent: { value: 85 } }, null, {
      rpe: { value: 8 },
    });

    expect(buildEffectiveIntensityTexts(resolved, "row")).toEqual([
      { dimension: "effortPercent", text: "EFFORT 85%", inherited: true },
      { dimension: "rpe", text: "RPE 8", inherited: false },
    ]);
  });
});
