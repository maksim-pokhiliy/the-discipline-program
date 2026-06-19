import { describe, expect, it } from "vitest";

import type { Intensity } from "@repo/contracts/lms/_shared";

import { formatBlockIntensity, formatIntensity } from "./format-intensity";

describe("formatIntensity (row sub-line)", () => {
  it("returns an empty string for a null intensity", () => {
    expect(formatIntensity(null)).toBe("");
  });

  it("renders rpe as 'RPE <value>'", () => {
    const intensity: Intensity = { rpe: { value: 7 } };

    expect(formatIntensity(intensity)).toBe("RPE 7");
  });

  it("renders a single effortPercent as '<value>% effort'", () => {
    const intensity: Intensity = { effortPercent: { value: 70 } };

    expect(formatIntensity(intensity)).toBe("70% effort");
  });

  it("renders an effortPercent range with an EN DASH", () => {
    const intensity: Intensity = { effortPercent: { range: { min: 60, max: 70 } } };

    expect(formatIntensity(intensity)).toBe("60–70% effort");
  });

  it("renders pace as '<pace> pace'", () => {
    const intensity: Intensity = { pace: "easy" };

    expect(formatIntensity(intensity)).toBe("easy pace");
  });

  it("renders an hrZone as the bare zone", () => {
    const intensity: Intensity = { hrZone: { zone: "Z2" } };

    expect(formatIntensity(intensity)).toBe("Z2");
  });

  it("renders a numericPace as '<value> / <unit>'", () => {
    const intensity: Intensity = {
      numericPace: { value: "1:45", distanceUnit: "km", paceType: "min_per_distance" },
    };

    expect(formatIntensity(intensity)).toBe("1:45 / km");
  });

  it("prefers rpe over the other dimensions when several are set", () => {
    const intensity: Intensity = { rpe: { value: 8 }, effortPercent: { value: 80 } };

    expect(formatIntensity(intensity)).toBe("RPE 8");
  });
});

describe("formatBlockIntensity (terse badge)", () => {
  it("returns an empty string for a null intensity", () => {
    expect(formatBlockIntensity(null)).toBe("");
  });

  it("renders rpe as 'RPE <value>'", () => {
    const intensity: Intensity = { rpe: { value: 7 } };

    expect(formatBlockIntensity(intensity)).toBe("RPE 7");
  });

  it("capitalizes a pace value", () => {
    const intensity: Intensity = { pace: "easy" };

    expect(formatBlockIntensity(intensity)).toBe("Easy");
  });

  it("renders a single effortPercent as a bare percentage", () => {
    const intensity: Intensity = { effortPercent: { value: 70 } };

    expect(formatBlockIntensity(intensity)).toBe("70%");
  });

  it("renders an effortPercent range as a bare percentage range", () => {
    const intensity: Intensity = { effortPercent: { range: { min: 60, max: 70 } } };

    expect(formatBlockIntensity(intensity)).toBe("60–70%");
  });

  it("renders an hrZone as the bare zone", () => {
    const intensity: Intensity = { hrZone: { zone: "Z4" } };

    expect(formatBlockIntensity(intensity)).toBe("Z4");
  });

  it("prefers pace over effortPercent in the terse form", () => {
    const intensity: Intensity = { pace: "hard", effortPercent: { value: 90 } };

    expect(formatBlockIntensity(intensity)).toBe("Hard");
  });
});
