import { describe, expect, it } from "vitest";

import type { Intensity } from "@repo/contracts/lms/_shared";

import { buildCascadeChips } from "./build-cascade-chips";

const FULL_BLOCK_INTENSITY: Intensity = {
  effortPercent: { value: 80 },
  rpe: { value: 7 },
  pace: "moderate",
  hrZone: { zone: "Z3" },
  numericPace: { value: "4:30", distanceUnit: "km", paceType: "min_per_distance" },
};

describe("buildCascadeChips", () => {
  it("returns no chips when both schema and block intensities are null", () => {
    expect(buildCascadeChips(null, null)).toEqual([]);
  });

  it("returns no chips when block intensity is null and schema has dimensions", () => {
    const schemaIntensity: Intensity = { rpe: { value: 8 } };

    expect(buildCascadeChips(schemaIntensity, null)).toEqual([]);
  });

  it("returns a cascade chip per block dimension when schema intensity is null", () => {
    expect(buildCascadeChips(null, FULL_BLOCK_INTENSITY)).toEqual([
      { text: "@ 80%" },
      { text: "RPE 7" },
      { text: "pace · moderate" },
      { text: "HR Z3" },
      { text: "4:30 / km" },
    ]);
  });

  it("returns no chips when schema overrides every block dimension", () => {
    const schemaIntensity: Intensity = {
      effortPercent: { value: 90 },
      rpe: { value: 9 },
      pace: "hard",
      hrZone: { zone: "Z4" },
      numericPace: { value: "4:00", distanceUnit: "km", paceType: "min_per_distance" },
    };

    expect(buildCascadeChips(schemaIntensity, FULL_BLOCK_INTENSITY)).toEqual([]);
  });

  it("omits a cascade chip for a dimension the schema overrides", () => {
    const schemaIntensity: Intensity = { rpe: { value: 9 } };

    expect(buildCascadeChips(schemaIntensity, FULL_BLOCK_INTENSITY)).toEqual([
      { text: "@ 80%" },
      { text: "pace · moderate" },
      { text: "HR Z3" },
      { text: "4:30 / km" },
    ]);
  });

  it("emits only the effortPercent cascade when block has only effortPercent and schema is null", () => {
    const blockIntensity: Intensity = { effortPercent: { value: 70 } };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "@ 70%" }]);
  });

  it("renders effortPercent range subtype as '@ <min>–<max>%'", () => {
    const blockIntensity: Intensity = { effortPercent: { range: { min: 65, max: 75 } } };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "@ 65–75%" }]);
  });

  it("emits only the rpe cascade when block has only rpe", () => {
    const blockIntensity: Intensity = { rpe: { value: 8 } };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "RPE 8" }]);
  });

  it("emits only the pace cascade when block has only pace", () => {
    const blockIntensity: Intensity = { pace: "easy" };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "pace · easy" }]);
  });

  it("emits only the hrZone cascade when block has only hrZone", () => {
    const blockIntensity: Intensity = { hrZone: { zone: "Z5" } };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "HR Z5" }]);
  });

  it("emits only the numericPace cascade when block has only numericPace", () => {
    const blockIntensity: Intensity = {
      numericPace: { value: "3:45", distanceUnit: "mi", paceType: "min_per_distance" },
    };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([{ text: "3:45 / mi" }]);
  });

  it("emits one cascade chip per overlapping dimension the schema does not set", () => {
    const blockIntensity: Intensity = {
      effortPercent: { value: 80 },
      rpe: { value: 7 },
    };
    const schemaIntensity: Intensity = { effortPercent: { value: 90 } };

    expect(buildCascadeChips(schemaIntensity, blockIntensity)).toEqual([{ text: "RPE 7" }]);
  });

  it("preserves the canonical dim order effortPercent → rpe → pace → hrZone → numericPace", () => {
    const out = buildCascadeChips(null, FULL_BLOCK_INTENSITY);

    expect(out.map((c) => c.text)).toEqual([
      "@ 80%",
      "RPE 7",
      "pace · moderate",
      "HR Z3",
      "4:30 / km",
    ]);
  });

  it("mirrors format-block-meta intensity text shape for drift regression (D-18)", () => {
    const blockIntensity: Intensity = {
      effortPercent: { range: { min: 60, max: 70 } },
      rpe: { value: 9 },
      pace: "recovery",
      hrZone: { zone: "Z1" },
      numericPace: { value: "5:00", distanceUnit: "lap", paceType: "distance_per_min" },
    };

    expect(buildCascadeChips(null, blockIntensity)).toEqual([
      { text: "@ 60–70%" },
      { text: "RPE 9" },
      { text: "pace · recovery" },
      { text: "HR Z1" },
      { text: "5:00 / lap" },
    ]);
  });
});
