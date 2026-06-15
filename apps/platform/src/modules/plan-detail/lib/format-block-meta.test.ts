import { describe, expect, it } from "vitest";

import type { Intensity } from "@repo/contracts/lms/_shared";

import { formatIntensityChips } from "./format-block-meta";

const makeIntensity = (overrides: Partial<Intensity> = {}): Intensity => ({
  rpe: { value: 7 },
  ...overrides,
});

describe("formatIntensityChips", () => {
  it("returns an empty array when intensity is null", () => {
    expect(formatIntensityChips(null)).toEqual([]);
  });

  it("returns a primary chip for an effortPercent.value reading", () => {
    const intensity = makeIntensity({ rpe: undefined, effortPercent: { value: 80 } });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "primary", text: "EFFORT 80%" }]);
  });

  it("returns a primary chip joined with EN DASH for an effortPercent.range reading", () => {
    const intensity = makeIntensity({
      rpe: undefined,
      effortPercent: { range: { min: 70, max: 85 } },
    });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "primary", text: "EFFORT 70–85%" }]);
  });

  it("returns an info chip for an rpe reading", () => {
    const intensity = makeIntensity({ rpe: { value: 8 } });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "info", text: "RPE 8" }]);
  });

  it("returns a default chip for a pace reading", () => {
    const intensity = makeIntensity({ rpe: undefined, pace: "moderate" });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "default", text: "PACE · MODERATE" }]);
  });

  it("returns an info chip for an hrZone reading", () => {
    const intensity = makeIntensity({ rpe: undefined, hrZone: { zone: "Z3" } });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "info", text: "HR Z3" }]);
  });

  it("returns a default chip joined with ' / ' for a numericPace reading", () => {
    const intensity = makeIntensity({
      rpe: undefined,
      numericPace: { value: "4:30", distanceUnit: "km", paceType: "min_per_distance" },
    });

    expect(formatIntensityChips(intensity)).toEqual([{ tone: "default", text: "4:30 / km" }]);
  });

  it("emits chips in canonical order effortPercent → rpe → pace → hrZone → numericPace when several dimensions are set", () => {
    const intensity: Intensity = {
      effortPercent: { value: 75 },
      rpe: { value: 6 },
      pace: "hard",
      hrZone: { zone: "Z4" },
      numericPace: { value: "5:00", distanceUnit: "mi", paceType: "min_per_distance" },
    };

    expect(formatIntensityChips(intensity)).toEqual([
      { tone: "primary", text: "EFFORT 75%" },
      { tone: "info", text: "RPE 6" },
      { tone: "default", text: "PACE · HARD" },
      { tone: "info", text: "HR Z4" },
      { tone: "default", text: "5:00 / mi" },
    ]);
  });

  it("honors the effortPercent discriminator branch: value vs range produce distinct text shapes", () => {
    const valueIntensity = makeIntensity({ rpe: undefined, effortPercent: { value: 65 } });
    const rangeIntensity = makeIntensity({
      rpe: undefined,
      effortPercent: { range: { min: 60, max: 70 } },
    });

    expect(formatIntensityChips(valueIntensity)).toEqual([{ tone: "primary", text: "EFFORT 65%" }]);
    expect(formatIntensityChips(rangeIntensity)).toEqual([
      { tone: "primary", text: "EFFORT 60–70%" },
    ]);
  });

  it("emits one chip per dimension when the maximum of five dimensions is populated with effortPercent.range", () => {
    const intensity: Intensity = {
      effortPercent: { range: { min: 50, max: 60 } },
      rpe: { value: 9 },
      pace: "easy",
      hrZone: { zone: "Z5" },
      numericPace: { value: "3:45", distanceUnit: "lap", paceType: "distance_per_min" },
    };

    expect(formatIntensityChips(intensity)).toHaveLength(5);
  });
});
