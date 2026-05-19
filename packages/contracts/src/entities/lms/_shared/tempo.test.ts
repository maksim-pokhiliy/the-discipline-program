import { describe, expect, it } from "vitest";

import { fullTempoSchema, tempoModifierSchema } from "./tempo";

describe("fullTempoSchema", () => {
  it("accepts 3-1-2-0 quad", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 })
        .success,
    ).toBe(true);
  });

  it("accepts eccentric 0 (X — explosive)", () => {
    expect(
      fullTempoSchema.safeParse({ eccentric: 0, pauseBottom: 0, concentric: 0, pauseTop: 0 })
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

  it("rejects missing field", () => {
    expect(fullTempoSchema.safeParse({ eccentric: 3, pauseBottom: 1, concentric: 2 }).success).toBe(
      false,
    );
  });
});

describe("tempoModifierSchema", () => {
  it("accepts pauseInUp alone", () => {
    expect(tempoModifierSchema.safeParse({ pauseInUp: { durationSec: 2 } }).success).toBe(true);
  });

  it("accepts pauseInUp with optional position 'up'", () => {
    expect(
      tempoModifierSchema.safeParse({ pauseInUp: { durationSec: 2, position: "up" } }).success,
    ).toBe(true);
  });

  it("accepts perNthRepPause alone", () => {
    expect(
      tempoModifierSchema.safeParse({ perNthRepPause: { everyN: 3, pauseSec: 5 } }).success,
    ).toBe(true);
  });

  it("accepts slowEccentric alone", () => {
    expect(tempoModifierSchema.safeParse({ slowEccentric: { durationSec: 4 } }).success).toBe(true);
  });

  it("accepts holdAfterLast alone", () => {
    expect(tempoModifierSchema.safeParse({ holdAfterLast: { durationSec: 10 } }).success).toBe(
      true,
    );
  });

  it("accepts fullTempo alone", () => {
    expect(
      tempoModifierSchema.safeParse({
        fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 },
      }).success,
    ).toBe(true);
  });

  it("accepts combined fields (pauseInUp + slowEccentric)", () => {
    expect(
      tempoModifierSchema.safeParse({
        pauseInUp: { durationSec: 2 },
        slowEccentric: { durationSec: 4 },
      }).success,
    ).toBe(true);
  });

  it("rejects empty object (at-least-one refine)", () => {
    expect(tempoModifierSchema.safeParse({}).success).toBe(false);
  });

  it("rejects pauseInUp with negative durationSec", () => {
    expect(tempoModifierSchema.safeParse({ pauseInUp: { durationSec: -1 } }).success).toBe(false);
  });

  it("rejects perNthRepPause with non-integer everyN", () => {
    expect(
      tempoModifierSchema.safeParse({ perNthRepPause: { everyN: 2.5, pauseSec: 5 } }).success,
    ).toBe(false);
  });

  it("rejects pauseInUp with unknown position", () => {
    expect(
      tempoModifierSchema.safeParse({ pauseInUp: { durationSec: 2, position: "down" } }).success,
    ).toBe(false);
  });
});
