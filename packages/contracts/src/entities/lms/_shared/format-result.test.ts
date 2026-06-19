import { describe, expect, it } from "vitest";

import { formatResult, formatResultParts } from "./format-result";
import { type Result } from "./result";

describe("formatResult", () => {
  it("renders a time result as m:ss", () => {
    const result: Result = { type: "time", seconds: 305 };

    expect(formatResult(result)).toBe("5:05");
  });

  it("pads sub-ten seconds in a time result", () => {
    const result: Result = { type: "time", seconds: 64 };

    expect(formatResult(result)).toBe("1:04");
  });

  it("renders a rounds_reps result", () => {
    const result: Result = { type: "rounds_reps", rounds: 8, reps: 12 };

    expect(formatResult(result)).toBe("8 rounds + 12 reps");
  });

  it("renders a load result in kg", () => {
    const result: Result = { type: "load", kg: 100 };

    expect(formatResult(result)).toBe("100 kg");
  });

  it("renders a max_reps result", () => {
    const result: Result = { type: "max_reps", reps: 42 };

    expect(formatResult(result)).toBe("42 reps");
  });

  it("renders a distance result with its unit", () => {
    const result: Result = { type: "distance", value: 5, unit: "km" };

    expect(formatResult(result)).toBe("5 km");
  });

  it("renders a calories result", () => {
    const result: Result = { type: "calories", value: 60 };

    expect(formatResult(result)).toBe("60 cal");
  });
});

describe("formatResultParts", () => {
  it("splits a time result into a value and an empty unit", () => {
    const result: Result = { type: "time", seconds: 305 };

    expect(formatResultParts(result)).toEqual({ value: "5:05", unit: "" });
  });

  it("splits a rounds_reps result into the combined count and the rounds unit", () => {
    const result: Result = { type: "rounds_reps", rounds: 21, reps: 9 };

    expect(formatResultParts(result)).toEqual({ value: "21 + 9", unit: "rounds" });
  });

  it("splits a load result into the kg value and the kg unit", () => {
    const result: Result = { type: "load", kg: 100 };

    expect(formatResultParts(result)).toEqual({ value: "100", unit: "kg" });
  });

  it("splits a max_reps result into the reps value and the reps unit", () => {
    const result: Result = { type: "max_reps", reps: 42 };

    expect(formatResultParts(result)).toEqual({ value: "42", unit: "reps" });
  });

  it("splits a distance result into the value and its own unit", () => {
    const result: Result = { type: "distance", value: 5, unit: "km" };

    expect(formatResultParts(result)).toEqual({ value: "5", unit: "km" });
  });

  it("splits a calories result into the value and the cal unit", () => {
    const result: Result = { type: "calories", value: 60 };

    expect(formatResultParts(result)).toEqual({ value: "60", unit: "cal" });
  });
});
