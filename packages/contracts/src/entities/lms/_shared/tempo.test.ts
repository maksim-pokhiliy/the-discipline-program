import { describe, expect, it } from "vitest";

import { fullTempoSchema, tempoModifierSchema } from "./tempo";

describe("fullTempoSchema", () => {
  it("accepts 3-1-2-0 quad", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(true);
  });

  it("accepts an explosive X concentric", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 })
        .success,
    ).toBe(true);
  });

  it("accepts upper bound 60 for all fields", () => {
    expect(
      fullTempoSchema.safeParse({
        eccentric: 60,
        pauseBottom: 60,
        concentric: 60,
        pauseTop: 60,
      }).success,
    ).toBe(true);
  });

  it("rejects value above 60", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 61, pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(false);
  });

  it("rejects negative value", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: -1, pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(false);
  });

  it("rejects non-integer value", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 3.5, pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(false);
  });

  it("rejects a lowercase x position (only literal X is allowed)", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: "x", pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(false);
  });

  it("rejects missing field", () => {
    expect(fullTempoSchema.safeParse({ eccentric: 3, pauseBottom: 1, concentric: 2 }).success).toBe(
      false,
    );
  });
});

describe("tempoModifierSchema", () => {
  it("is the full-tempo quad directly", () => {
    expect(
      tempoModifierSchema.safeParse({
        eccentric: 3,
        pauseBottom: 1,
        concentric: 2,
        pauseTop: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects the dropped verbal slowEccentric form", () => {
    expect(tempoModifierSchema.safeParse({ slowEccentric: { durationSec: 4 } }).success).toBe(
      false,
    );
  });

  it("rejects the dropped verbal pauseInUp form", () => {
    expect(tempoModifierSchema.safeParse({ pauseInUp: { durationSec: 2 } }).success).toBe(false);
  });

  it("rejects the dropped verbal holdAfterLast form", () => {
    expect(tempoModifierSchema.safeParse({ holdAfterLast: { durationSec: 10 } }).success).toBe(
      false,
    );
  });

  it("rejects the dropped verbal perNthRepPause form", () => {
    expect(
      tempoModifierSchema.safeParse({ perNthRepPause: { everyN: 3, pauseSec: 5 } }).success,
    ).toBe(false);
  });

  it("rejects the dropped fullTempo wrapper shape", () => {
    expect(
      tempoModifierSchema.safeParse({
        fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 },
      }).success,
    ).toBe(false);
  });
});
