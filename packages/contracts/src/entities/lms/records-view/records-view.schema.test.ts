import { describe, expect, it } from "vitest";

import {
  benchmarkDeltaSchema,
  benchmarkSeriesPointSchema,
  oneRMRecordViewSchema,
  oneRMSeriesPointSchema,
} from "./records-view.schema";

const CUID = "ck1234567890123456789012";
const ISO = "2026-01-01T00:00:00.000Z";

const baseSeriesPoint = {
  valueKg: 142.45,
  source: "MANUAL",
  recordedAt: ISO,
  isBest: true,
};

const baseOneRMView = {
  exerciseId: CUID,
  exerciseName: "Back Squat",
  best: 142.45,
  bestSource: "MANUAL",
  bestRecordedAt: ISO,
  lastRecordedAt: ISO,
  delta: -12.5,
  recordCount: 3,
  series: [baseSeriesPoint],
};

const baseBenchmarkSeriesPoint = {
  result: { type: "load", kg: 100 },
  scalar: 0,
  recordedAt: ISO,
  isBest: true,
};

const baseBenchmarkDelta = {
  value: -12.5,
  improved: false,
};

describe("oneRMSeriesPointSchema", () => {
  it("accepts an in-bound 2-decimal valueKg", () => {
    expect(oneRMSeriesPointSchema.safeParse({ ...baseSeriesPoint, valueKg: 142.45 }).success).toBe(
      true,
    );
  });

  it("accepts a float-trap 2-decimal valueKg", () => {
    expect(oneRMSeriesPointSchema.safeParse({ ...baseSeriesPoint, valueKg: 19.99 }).success).toBe(
      true,
    );
  });

  it("rejects valueKg over ONE_RM_MAX_KG", () => {
    expect(oneRMSeriesPointSchema.safeParse({ ...baseSeriesPoint, valueKg: 10000 }).success).toBe(
      false,
    );
  });
});

describe("oneRMRecordViewSchema", () => {
  it("accepts an in-bound 2-decimal best", () => {
    expect(oneRMRecordViewSchema.safeParse({ ...baseOneRMView, best: 142.45 }).success).toBe(true);
  });

  it("rejects best over ONE_RM_MAX_KG", () => {
    expect(oneRMRecordViewSchema.safeParse({ ...baseOneRMView, best: 10000 }).success).toBe(false);
  });

  it("accepts a negative delta (stays bare z.number())", () => {
    expect(oneRMRecordViewSchema.safeParse({ ...baseOneRMView, delta: -12.5 }).success).toBe(true);
  });

  it("accepts a zero delta", () => {
    expect(oneRMRecordViewSchema.safeParse({ ...baseOneRMView, delta: 0 }).success).toBe(true);
  });
});

describe("benchmarkSeriesPointSchema", () => {
  it("accepts a zero scalar (stays bare z.number())", () => {
    expect(
      benchmarkSeriesPointSchema.safeParse({ ...baseBenchmarkSeriesPoint, scalar: 0 }).success,
    ).toBe(true);
  });

  it("accepts a negative scalar", () => {
    expect(
      benchmarkSeriesPointSchema.safeParse({ ...baseBenchmarkSeriesPoint, scalar: -12.5 }).success,
    ).toBe(true);
  });
});

describe("benchmarkDeltaSchema", () => {
  it("accepts a negative value (stays bare z.number())", () => {
    expect(benchmarkDeltaSchema.safeParse({ ...baseBenchmarkDelta, value: -12.5 }).success).toBe(
      true,
    );
  });

  it("accepts a zero value", () => {
    expect(benchmarkDeltaSchema.safeParse({ ...baseBenchmarkDelta, value: 0 }).success).toBe(true);
  });
});
