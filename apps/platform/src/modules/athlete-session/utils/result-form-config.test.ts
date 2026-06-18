import { describe, expect, it } from "vitest";

import { resultSchema, RESULT_TYPES } from "@repo/contracts/lms/_shared";

import {
  buildResult,
  CALORIES_KEY,
  DISTANCE_UNIT_KEY,
  DISTANCE_VALUE_KEY,
  isResultDraftValid,
  LOAD_KEY,
  MAX_REPS_KEY,
  REPS_KEY,
  RESULT_FORM_CONFIG,
  ROUNDS_KEY,
  TIME_MINUTES_KEY,
  TIME_SECONDS_KEY,
} from "./result-form-config";

describe("RESULT_FORM_CONFIG", () => {
  it("declares a config entry for every result type", () => {
    RESULT_TYPES.forEach((resultType) => {
      expect(RESULT_FORM_CONFIG[resultType]).toBeDefined();
    });
  });

  it("builds a time result from minutes and seconds", () => {
    const result = buildResult("time", { [TIME_MINUTES_KEY]: "5", [TIME_SECONDS_KEY]: "5" });

    expect(result).toEqual({ type: "time", seconds: 305 });
    expect(resultSchema.safeParse(result).success).toBe(true);
  });

  it("treats a blank seconds field as zero for time", () => {
    const result = buildResult("time", { [TIME_MINUTES_KEY]: "12", [TIME_SECONDS_KEY]: "" });

    expect(result).toEqual({ type: "time", seconds: 720 });
  });

  it("rejects an all-zero time", () => {
    expect(buildResult("time", { [TIME_MINUTES_KEY]: "0", [TIME_SECONDS_KEY]: "0" })).toBeNull();
  });

  it("builds a rounds_reps result", () => {
    const result = buildResult("rounds_reps", { [ROUNDS_KEY]: "8", [REPS_KEY]: "12" });

    expect(result).toEqual({ type: "rounds_reps", rounds: 8, reps: 12 });
    expect(resultSchema.safeParse(result).success).toBe(true);
  });

  it("accepts zero reps when rounds are present for rounds_reps", () => {
    expect(buildResult("rounds_reps", { [ROUNDS_KEY]: "10", [REPS_KEY]: "0" })).toEqual({
      type: "rounds_reps",
      rounds: 10,
      reps: 0,
    });
  });

  it("rejects a fractional rounds value", () => {
    expect(buildResult("rounds_reps", { [ROUNDS_KEY]: "8.5", [REPS_KEY]: "0" })).toBeNull();
  });

  it("builds a load result and rejects non-positive load", () => {
    expect(buildResult("load", { [LOAD_KEY]: "100" })).toEqual({ type: "load", kg: 100 });
    expect(buildResult("load", { [LOAD_KEY]: "0" })).toBeNull();
  });

  it("builds a max_reps result and rejects zero", () => {
    expect(buildResult("max_reps", { [MAX_REPS_KEY]: "42" })).toEqual({
      type: "max_reps",
      reps: 42,
    });
    expect(buildResult("max_reps", { [MAX_REPS_KEY]: "0" })).toBeNull();
  });

  it("builds a distance result with the chosen unit", () => {
    const result = buildResult("distance", {
      [DISTANCE_VALUE_KEY]: "5",
      [DISTANCE_UNIT_KEY]: "km",
    });

    expect(result).toEqual({ type: "distance", value: 5, unit: "km" });
    expect(resultSchema.safeParse(result).success).toBe(true);
  });

  it("defaults the distance unit to metres when unset", () => {
    expect(buildResult("distance", { [DISTANCE_VALUE_KEY]: "400" })).toEqual({
      type: "distance",
      value: 400,
      unit: "m",
    });
  });

  it("builds a calories result and rejects fractional values", () => {
    expect(buildResult("calories", { [CALORIES_KEY]: "60" })).toEqual({
      type: "calories",
      value: 60,
    });
    expect(buildResult("calories", { [CALORIES_KEY]: "60.5" })).toBeNull();
  });

  it("reports validity through isResultDraftValid", () => {
    expect(isResultDraftValid("load", { [LOAD_KEY]: "80" })).toBe(true);
    expect(isResultDraftValid("load", {})).toBe(false);
  });
});
