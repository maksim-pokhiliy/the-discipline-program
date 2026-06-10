import { describe, expect, it } from "vitest";

import { PARALLEL_INTERLEAVE_ORDERS } from "./composition.constants";
import {
  arrangementAxisSchema,
  compositionSchema,
  repetitionAxisSchema,
  restAxisSchema,
} from "./composition.schema";

const cuidA = "clz0000000000000000000aaa";
const cuidB = "clz0000000000000000000bbb";
const cuidC = "clz0000000000000000000ccc";

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
      repetitionAxisSchema.safeParse({ kind: "interval", workMin: 2, offMin: 1, count: 3 }).success,
    ).toBe(true);
  });

  it("accepts interval with offMin zero", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "interval", workMin: 2, offMin: 0, count: 3 }).success,
    ).toBe(true);
  });

  it("rejects interval with workMin zero", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "interval", workMin: 0, offMin: 1, count: 3 }).success,
    ).toBe(false);
  });

  it("rejects interval with count zero", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "interval", workMin: 2, offMin: 1, count: 0 }).success,
    ).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(repetitionAxisSchema.safeParse({ kind: "tabata" }).success).toBe(false);
  });
});

describe("arrangementAxisSchema", () => {
  it("accepts ordered", () => {
    expect(arrangementAxisSchema.safeParse({ kind: "ordered" }).success).toBe(true);
  });

  it("rejects the removed parallel arm for every legacy interleave order", () => {
    for (const interleaveOrder of PARALLEL_INTERLEAVE_ORDERS) {
      expect(
        arrangementAxisSchema.safeParse({
          kind: "parallel",
          interleaveOrder,
          tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidB }],
        }).success,
      ).toBe(false);
    }
  });

  it("accepts superset with pairs of at least two rows", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidA, cuidB] }],
      }).success,
    ).toBe(true);
  });

  it("rejects superset with empty pairs", () => {
    expect(arrangementAxisSchema.safeParse({ kind: "superset", pairs: [] }).success).toBe(false);
  });

  it("rejects a superset pair with fewer than two rows", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidA] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a superset pair with duplicate rowIds", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidA, cuidA] }],
      }).success,
    ).toBe(false);
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

  it("accepts a single-axis bundle", () => {
    expect(
      compositionSchema.safeParse({ repetition: { kind: "ladder", steps: [21, 15, 9] } }).success,
    ).toBe(true);
  });

  it("accepts an all-axes bundle", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        arrangement: {
          kind: "superset",
          pairs: [{ label: "A", rowIds: [cuidA, cuidC] }],
        },
        interleaveOrder: "round_by_round",
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
  });

  it("accepts a root interleaveOrder for every interleave order", () => {
    for (const interleaveOrder of PARALLEL_INTERLEAVE_ORDERS) {
      expect(compositionSchema.safeParse({ interleaveOrder }).success).toBe(true);
    }
  });

  it("rejects a root interleaveOrder outside the enum", () => {
    expect(compositionSchema.safeParse({ interleaveOrder: "zigzag" }).success).toBe(false);
  });

  it("rejects a stale stored-tracks parallel arrangement blob", () => {
    expect(
      compositionSchema.safeParse({
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidB }],
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

  it("rejects an unknown key alongside a root interleaveOrder", () => {
    expect(
      compositionSchema.safeParse({ interleaveOrder: "round_by_round", bogus: 1 }).success,
    ).toBe(false);
  });
});
