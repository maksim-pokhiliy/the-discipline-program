import { describe, expect, it } from "vitest";

import { type Result } from "@repo/contracts/lms";

import { buildResultSeries, deriveBestResult, isNewPR } from "./derive-records";

const at = (iso: string): Date => new Date(iso);

describe("deriveBestResult", () => {
  it("returns null for an empty series", () => {
    expect(deriveBestResult([])).toBeNull();
  });

  it("picks the lowest time (lower is better)", () => {
    const best = deriveBestResult([
      { result: { type: "time", seconds: 180 }, performedAt: at("2026-01-01") },
      { result: { type: "time", seconds: 150 }, performedAt: at("2026-02-01") },
      { result: { type: "time", seconds: 165 }, performedAt: at("2026-03-01") },
    ]);

    expect(best).toEqual({ type: "time", seconds: 150 });
  });

  it("picks the highest load (higher is better)", () => {
    const best = deriveBestResult([
      { result: { type: "load", kg: 100 }, performedAt: at("2026-01-01") },
      { result: { type: "load", kg: 120 }, performedAt: at("2026-02-01") },
    ]);

    expect(best).toEqual({ type: "load", kg: 120 });
  });

  it("breaks rounds_reps ties by reps after rounds", () => {
    const best = deriveBestResult([
      { result: { type: "rounds_reps", rounds: 5, reps: 3 }, performedAt: at("2026-01-01") },
      { result: { type: "rounds_reps", rounds: 5, reps: 10 }, performedAt: at("2026-02-01") },
      { result: { type: "rounds_reps", rounds: 4, reps: 20 }, performedAt: at("2026-03-01") },
    ]);

    expect(best).toEqual({ type: "rounds_reps", rounds: 5, reps: 10 });
  });
});

describe("isNewPR", () => {
  it("is a PR against a null prior best", () => {
    expect(isNewPR(null, { type: "load", kg: 50 })).toBe(true);
  });

  it("is a PR when a faster time beats the prior best", () => {
    const prior: Result = { type: "time", seconds: 200 };

    expect(isNewPR(prior, { type: "time", seconds: 190 })).toBe(true);
  });

  it("is not a PR when the candidate ties the prior best", () => {
    const prior: Result = { type: "load", kg: 100 };

    expect(isNewPR(prior, { type: "load", kg: 100 })).toBe(false);
  });

  it("is not a PR when a slower time does not beat the prior best", () => {
    const prior: Result = { type: "time", seconds: 150 };

    expect(isNewPR(prior, { type: "time", seconds: 160 })).toBe(false);
  });
});

describe("buildResultSeries", () => {
  it("orders entries chronologically", () => {
    const series = buildResultSeries([
      { result: { type: "max_reps", reps: 12 }, performedAt: at("2026-03-01") },
      { result: { type: "max_reps", reps: 8 }, performedAt: at("2026-01-01") },
      { result: { type: "max_reps", reps: 15 }, performedAt: at("2026-02-01") },
    ]);

    expect(series.map((entry) => entry.performedAt.toISOString())).toEqual([
      at("2026-01-01").toISOString(),
      at("2026-02-01").toISOString(),
      at("2026-03-01").toISOString(),
    ]);
  });
});
