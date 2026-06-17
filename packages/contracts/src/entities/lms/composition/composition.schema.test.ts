import { describe, expect, it } from "vitest";

import { compositionSchema, repetitionAxisSchema, restAxisSchema } from "./composition.schema";

describe("repetitionAxisSchema", () => {
  it("accepts once", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "once" }).success).toBe(true);
  });

  it("accepts count with a positive int", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "count", count: 5 }).success).toBe(true);
  });

  it("accepts count with a valid range", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "count", count: { min: 3, max: 9 } }).success,
    ).toBe(true);
  });

  it("rejects count zero", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "count", count: 0 }).success).toBe(false);
  });

  it("rejects count negative", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "count", count: -1 }).success).toBe(false);
  });

  it("rejects count range where min > max", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "count", count: { min: 9, max: 3 } }).success,
    ).toBe(false);
  });

  it("accepts ladder with non-empty steps", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "ladder", steps: [21, 15, 9] }).success).toBe(
      true,
    );
  });

  it("rejects ladder with empty steps", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "ladder", steps: [] }).success).toBe(false);
  });

  it("rejects ladder with a zero step", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "ladder", steps: [0] }).success).toBe(false);
  });

  it("rejects ladder with a negative step", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "ladder", steps: [-1] }).success).toBe(false);
  });

  it("accepts timeCap with a valid cap", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "timeCap", cap: { min: 12, unit: "min" } }).success,
    ).toBe(true);
  });

  it("accepts cadence with everyMin and rounds", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "cadence", everyMin: 1, rounds: 4 }).success,
    ).toBe(true);
  });

  it("rejects cadence with everyMin zero", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "cadence", everyMin: 0, rounds: 4 }).success,
    ).toBe(false);
  });

  it("rejects cadence with rounds zero", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "cadence", everyMin: 1, rounds: 0 }).success,
    ).toBe(false);
  });

  it("accepts interval with positive work/off/count", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 1, unit: "min" },
        count: 3,
      }).success,
    ).toBe(true);
  });

  it("accepts a sub-minute Tabata interval (work/off in seconds)", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 20, unit: "sec" },
        off: { value: 10, unit: "sec" },
        count: 8,
      }).success,
    ).toBe(true);
  });

  it("accepts interval with off value zero", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 0, unit: "min" },
        count: 3,
      }).success,
    ).toBe(true);
  });

  it("accepts a fractional work value (non-integer durations allowed)", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 1.5, unit: "min" },
        off: { value: 0.5, unit: "min" },
        count: 4,
      }).success,
    ).toBe(true);
  });

  it("rejects interval with work value zero", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 0, unit: "sec" },
        off: { value: 10, unit: "sec" },
        count: 8,
      }).success,
    ).toBe(false);
  });

  it("rejects interval with an unknown duration unit", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 20, unit: "hours" },
        off: { value: 10, unit: "sec" },
        count: 8,
      }).success,
    ).toBe(false);
  });

  it("rejects interval with count zero", () => {
    expect(
      repetitionAxisSchema.safeParse({
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 1, unit: "min" },
        count: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "tabata" }).success).toBe(false);
  });
});

describe("restAxisSchema", () => {
  it("accepts a valid RestSpec", () => {
    expect(
      restAxisSchema.safeParse({ duration: { value: 60, unit: "sec" }, scope: "between_sets" })
        .success,
    ).toBe(true);
  });

  it("rejects range_sec without rangeMax", () => {
    expect(
      restAxisSchema.safeParse({
        duration: { value: 30, unit: "range_sec" },
        scope: "between_sets",
      }).success,
    ).toBe(false);
  });

  it("rejects a duration-free until_recovery rest (the QA-003 expressiveness gap)", () => {
    expect(
      restAxisSchema.safeParse({ scope: "between_rounds", qualifier: "until_recovery" }).success,
    ).toBe(false);
  });

  it("accepts the sham fixed-duration workaround for until_recovery", () => {
    expect(
      restAxisSchema.safeParse({
        duration: { value: 1, unit: "sec" },
        scope: "between_rounds",
        qualifier: "until_recovery",
      }).success,
    ).toBe(true);
  });
});

describe("compositionSchema", () => {
  it("accepts an empty bundle (all axes optional)", () => {
    expect(compositionSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a repetition-only bundle", () => {
    expect(
      compositionSchema.safeParse({ repetition: { kind: "ladder", steps: [21, 15, 9] } }).success,
    ).toBe(true);
  });

  it("accepts a repetition + rest bundle", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
  });

  it("accepts a cross-cutting cap alongside a ladder repetition (Fran 21-15-9 capped at 12 min)", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "ladder", steps: [21, 15, 9] },
        cap: { min: 12, unit: "min" },
      }).success,
    ).toBe(true);
  });

  it("accepts a redundant-but-valid cap on a timeCap repetition (cap is orthogonal, not a reject)", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "timeCap", cap: { min: 10, unit: "min" } },
        cap: { min: 12, unit: "min" },
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed cap (max not greater than min)", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "ladder", steps: [21, 15, 9] },
        cap: { min: 12, max: 10, unit: "min" },
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped arrangement axis (strict)", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        arrangement: { kind: "ordered" },
      }).success,
    ).toBe(false);
  });

  it("rejects the dropped top-level interleaveOrder field (strict)", () => {
    expect(compositionSchema.safeParse({ interleaveOrder: "round_by_round" }).success).toBe(false);
  });

  it("rejects a stale stored-tracks parallel arrangement blob", () => {
    expect(
      compositionSchema.safeParse({
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: "clz0000000000000000000aaa" }],
        },
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed nested axis", () => {
    expect(compositionSchema.safeParse({ repetition: { kind: "count", count: 0 } }).success).toBe(
      false,
    );
  });
});

describe("strict mode — unknown keys are rejected", () => {
  it("rejects an unknown key on a repetition variant", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "count", count: 5, bogus: 1 }).success).toBe(
      false,
    );
  });

  it("rejects an unknown top-level key on the composition bundle", () => {
    expect(compositionSchema.safeParse({ repetition: { kind: "once" }, bogus: 1 }).success).toBe(
      false,
    );
  });
});
