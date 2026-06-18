import { describe, expect, it } from "vitest";

import type { Result } from "@repo/contracts/lms/_shared";

import { formatResult } from "./format-result";

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
