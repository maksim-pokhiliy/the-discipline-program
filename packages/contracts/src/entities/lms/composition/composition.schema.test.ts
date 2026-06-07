import { describe, expect, it } from "vitest";

import { STAGED_PROGRAM_KINDS } from "../_shared";

import { PARALLEL_INTERLEAVE_ORDERS, SCORING_DIRECTIVE_KINDS } from "./composition.constants";
import {
  arrangementAxisSchema,
  compositionSchema,
  repetitionAxisSchema,
  restAxisSchema,
  scoringDirectiveSchema,
} from "./composition.schema";

const cuidA = "clz0000000000000000000aaa";
const cuidB = "clz0000000000000000000bbb";
const cuidC = "clz0000000000000000000ccc";
const cuidRow = "clz0000000000000000000ddd";

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

  it("accepts range where min < max", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "range", range: { min: 5, max: 9 } }).success,
    ).toBe(true);
  });

  it("rejects range where min === max", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "range", range: { min: 5, max: 5 } }).success,
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

  it("accepts cadence with an optional totalMin", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "cadence", everyMin: 1, rounds: 4, totalMin: 16 })
        .success,
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

  it("accepts window where start < end", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "09:00", endHhMm: "10:30" })
        .success,
    ).toBe(true);
  });

  it("accepts the EMOM one-minute box window 00:00 to 00:01", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "00:00", endHhMm: "00:01" })
        .success,
    ).toBe(true);
  });

  it("accepts a single-digit-hour window 9:30 to 10:30", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "9:30", endHhMm: "10:30" })
        .success,
    ).toBe(true);
  });

  it("rejects window with an out-of-clock value", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "99:99", endHhMm: "10:30" })
        .success,
    ).toBe(false);
  });

  it("rejects window where start > end", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "10:00", endHhMm: "09:00" })
        .success,
    ).toBe(false);
  });

  it("rejects window where start === end", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "window", startHhMm: "10:00", endHhMm: "10:00" })
        .success,
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

  it("accepts parallel for every interleave order", () => {
    for (const interleaveOrder of PARALLEL_INTERLEAVE_ORDERS) {
      expect(
        arrangementAxisSchema.safeParse({
          kind: "parallel",
          interleaveOrder,
          tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidB }],
        }).success,
      ).toBe(true);
    }
  });

  it("rejects parallel with fewer than two tracks", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidA }],
      }).success,
    ).toBe(false);
  });

  it("rejects parallel with duplicate childSchemaId", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidA }],
      }).success,
    ).toBe(false);
  });

  it("rejects parallel with a bad interleave order", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "zigzag",
        tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidB }],
      }).success,
    ).toBe(false);
  });

  it("accepts a track carrying setEnumeration and pairedWithRowId", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: cuidA, setEnumeration: [1, 2, 3], pairedWithRowId: cuidRow },
          { childSchemaId: cuidB },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a track with empty setEnumeration", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidA, setEnumeration: [] }, { childSchemaId: cuidB }],
      }).success,
    ).toBe(false);
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

describe("scoringDirectiveSchema", () => {
  it("accepts every scoring kind", () => {
    for (const kind of SCORING_DIRECTIVE_KINDS) {
      const input = kind === "progressive" ? { kind, seed: "3-2-1" } : { kind };

      expect(scoringDirectiveSchema.safeParse(input).success).toBe(true);
    }
  });

  it("accepts progressive with a seed", () => {
    expect(scoringDirectiveSchema.safeParse({ kind: "progressive", seed: "3-2-1" }).success).toBe(
      true,
    );
  });

  it("rejects progressive without a seed", () => {
    expect(scoringDirectiveSchema.safeParse({ kind: "progressive" }).success).toBe(false);
  });

  it("accepts a scored variant with an inert condition", () => {
    expect(
      scoringDirectiveSchema.safeParse({ kind: "amrap", condition: { appliesToRounds: [2, 3] } })
        .success,
    ).toBe(true);
  });

  it("rejects a condition with empty appliesToRounds", () => {
    expect(
      scoringDirectiveSchema.safeParse({ kind: "total", condition: { appliesToRounds: [] } })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown extra key on prescribed (no condition slot)", () => {
    expect(
      scoringDirectiveSchema.safeParse({
        kind: "prescribed",
        condition: { appliesToRounds: [2] },
      }).success,
    ).toBe(false);
  });

  it("rejects a function-valued seed (inertness holds at the parse boundary)", () => {
    expect(scoringDirectiveSchema.safeParse({ kind: "progressive", seed: () => "x" }).success).toBe(
      false,
    );
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

  it("accepts an all-four-axes bundle", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: cuidA }, { childSchemaId: cuidC }],
        },
        scoring: { kind: "for_time" },
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
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

  it("rejects a typo'd optional field on cadence", () => {
    expect(
      repetitionAxisSchema.safeParse({ kind: "cadence", everyMin: 1, rounds: 4, totalMins: 16 })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown top-level key on the composition bundle", () => {
    expect(compositionSchema.safeParse({ repetition: { kind: "once" }, bogus: 1 }).success).toBe(
      false,
    );
  });

  it("rejects an unknown key on a parallel track", () => {
    expect(
      arrangementAxisSchema.safeParse({
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidA, bogus: 1 }, { childSchemaId: cuidC }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown key on a scoring condition", () => {
    expect(
      scoringDirectiveSchema.safeParse({
        kind: "amrap",
        condition: { appliesToRounds: [2, 3], bogus: 1 },
      }).success,
    ).toBe(false);
  });
});

describe("compositionSchema programKind classifier (D-ONTOLOGY)", () => {
  it("accepts every staged program kind on the composition bundle", () => {
    for (const programKind of STAGED_PROGRAM_KINDS) {
      expect(compositionSchema.safeParse({ programKind }).success).toBe(true);
    }
  });

  it("rejects an unknown program kind", () => {
    expect(compositionSchema.safeParse({ programKind: "ramp" }).success).toBe(false);
  });

  it("accepts a bundle with no programKind (the classifier is optional)", () => {
    expect(compositionSchema.safeParse({}).success).toBe(true);
  });

  it("parses an existing full composition that carries no programKind", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        arrangement: { kind: "ordered" },
        scoring: { kind: "for_time" },
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
      }).success,
    ).toBe(true);
  });

  it("classifies the cluster as a round-counter plus a programKind (block-164 shape)", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 5 },
        programKind: "cluster",
      }).success,
    ).toBe(true);
  });

  it("round-trips programKind through a parse alongside the round counter", () => {
    const parsed = compositionSchema.parse({
      repetition: { kind: "count", count: 5 },
      programKind: "cluster",
    });

    expect(parsed.programKind).toBe("cluster");
    expect(parsed.repetition).toEqual({ kind: "count", count: 5 });
  });
});
