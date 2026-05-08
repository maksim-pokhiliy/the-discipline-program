import { describe, expect, it } from "vitest";

import { schemeParamsSchema } from "./scheme-archetype.schema";

describe("schemeParamsSchema — NONE", () => {
  it("accepts a bare NONE", () => {
    expect(schemeParamsSchema.parse({ kind: "NONE" })).toEqual({ kind: "NONE" });
  });

  it("strips extra payload fields not declared in NONE shape", () => {
    const result = schemeParamsSchema.safeParse({ kind: "NONE", durationSec: 60 });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ kind: "NONE" });
    }
  });

  it("rejects unknown kind", () => {
    const result = schemeParamsSchema.safeParse({ kind: "BOGUS" });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — SETS_REPS", () => {
  it("accepts a single set", () => {
    expect(schemeParamsSchema.parse({ kind: "SETS_REPS", sets: 1 })).toEqual({
      kind: "SETS_REPS",
      sets: 1,
    });
  });

  it("accepts a 5-set strength block", () => {
    expect(schemeParamsSchema.parse({ kind: "SETS_REPS", sets: 5 })).toEqual({
      kind: "SETS_REPS",
      sets: 5,
    });
  });

  it("accepts progression with per-set load overrides", () => {
    const value = {
      kind: "SETS_REPS" as const,
      sets: 5,
      progression: [
        { round: 1, reps: [3] },
        { round: 2, reps: [3] },
        { round: 3, reps: [1] },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects missing sets", () => {
    const result = schemeParamsSchema.safeParse({ kind: "SETS_REPS" });

    expect(result.success).toBe(false);
  });

  it("rejects zero sets", () => {
    const result = schemeParamsSchema.safeParse({ kind: "SETS_REPS", sets: 0 });

    expect(result.success).toBe(false);
  });

  it("rejects negative sets", () => {
    const result = schemeParamsSchema.safeParse({ kind: "SETS_REPS", sets: -3 });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer sets", () => {
    const result = schemeParamsSchema.safeParse({ kind: "SETS_REPS", sets: 2.5 });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — COUNT_UP", () => {
  it("accepts minimal", () => {
    expect(schemeParamsSchema.parse({ kind: "COUNT_UP" })).toEqual({ kind: "COUNT_UP" });
  });

  it("accepts cap and rounds and progression", () => {
    const value = {
      kind: "COUNT_UP" as const,
      cap: 600,
      rounds: 3,
      progression: [
        { round: 1, reps: [21] },
        { round: 2, reps: [15] },
        { round: 3, reps: [9] },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects negative cap", () => {
    const result = schemeParamsSchema.safeParse({ kind: "COUNT_UP", cap: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer round in progression", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "COUNT_UP",
      progression: [{ round: 1.5 }],
    });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — COUNT_DOWN", () => {
  it("accepts a 15-minute amrap", () => {
    expect(schemeParamsSchema.parse({ kind: "COUNT_DOWN", durationSec: 900 })).toEqual({
      kind: "COUNT_DOWN",
      durationSec: 900,
    });
  });

  it("rejects missing durationSec", () => {
    const result = schemeParamsSchema.safeParse({ kind: "COUNT_DOWN" });

    expect(result.success).toBe(false);
  });

  it("rejects zero durationSec", () => {
    const result = schemeParamsSchema.safeParse({ kind: "COUNT_DOWN", durationSec: 0 });

    expect(result.success).toBe(false);
  });

  it("rejects negative durationSec", () => {
    const result = schemeParamsSchema.safeParse({ kind: "COUNT_DOWN", durationSec: -10 });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — INTERVAL_LOOP", () => {
  it("accepts a tabata-shape", () => {
    const value = {
      kind: "INTERVAL_LOOP" as const,
      sets: 8,
      slots: [
        { durationSec: 20, action: "WORK" as const },
        { durationSec: 10, action: "REST" as const },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects empty slots array", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "INTERVAL_LOOP",
      sets: 1,
      slots: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown action", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "INTERVAL_LOOP",
      sets: 1,
      slots: [{ durationSec: 20, action: "FLOAT" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero sets", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "INTERVAL_LOOP",
      sets: 0,
      slots: [{ durationSec: 20, action: "WORK" }],
    });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — EMOM_LOOP", () => {
  it("accepts a 12-minute emom with one entry slot", () => {
    const value = {
      kind: "EMOM_LOOP" as const,
      totalMinutes: 12,
      slots: [
        {
          minutes: [0],
          action: { kind: "ENTRY" as const, entryRefIndex: 0 },
        },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("accepts cycleLength and MAX_OF_ENTRY action", () => {
    const value = {
      kind: "EMOM_LOOP" as const,
      totalMinutes: 20,
      cycleLength: 4,
      slots: [
        {
          minutes: [0, 1, 2, 3],
          action: { kind: "MAX_OF_ENTRY" as const, entryRefIndex: 1 },
        },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects empty slots", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "EMOM_LOOP",
      totalMinutes: 10,
      slots: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty minutes inside a slot", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "EMOM_LOOP",
      totalMinutes: 10,
      slots: [{ minutes: [], action: { kind: "REST" } }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects ENTRY action without entryRefIndex", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "EMOM_LOOP",
      totalMinutes: 10,
      slots: [{ minutes: [0], action: { kind: "ENTRY" } }],
    });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — TIME_BOXED inner archetype kind tuple", () => {
  it.each([
    ["NONE", { kind: "NONE" }],
    ["COUNT_UP", { kind: "COUNT_UP" }],
    ["COUNT_DOWN", { kind: "COUNT_DOWN", durationSec: 600 }],
    [
      "INTERVAL_LOOP",
      { kind: "INTERVAL_LOOP", sets: 1, slots: [{ durationSec: 30, action: "WORK" }] },
    ],
    [
      "EMOM_LOOP",
      {
        kind: "EMOM_LOOP",
        totalMinutes: 10,
        slots: [{ minutes: [0], action: { kind: "REST" } }],
      },
    ],
  ] as const)("accepts %s as innerArchetypeKind", (innerKind, innerParams) => {
    const result = schemeParamsSchema.safeParse({
      kind: "TIME_BOXED",
      segments: [
        {
          startSec: 0,
          endSec: 600,
          innerArchetypeKind: innerKind,
          innerParams,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it.each(["TIME_BOXED", "LADDER", "DISTANCE"] as const)(
    "rejects %s as innerArchetypeKind (only 5 of 8 archetypes are allowed inside)",
    (forbiddenInner) => {
      const result = schemeParamsSchema.safeParse({
        kind: "TIME_BOXED",
        segments: [
          {
            startSec: 0,
            endSec: 600,
            innerArchetypeKind: forbiddenInner,
            innerParams: { kind: "NONE" },
          },
        ],
      });

      expect(result.success).toBe(false);
    },
  );
});

describe("schemeParamsSchema — TIME_BOXED", () => {
  it("accepts a two-segment time-boxed shape", () => {
    const value = {
      kind: "TIME_BOXED" as const,
      segments: [
        {
          startSec: 0,
          endSec: 600,
          innerArchetypeKind: "COUNT_DOWN" as const,
          innerParams: { kind: "COUNT_DOWN", durationSec: 600 },
        },
        {
          startSec: 600,
          endSec: 1200,
          label: "Strength",
          innerArchetypeKind: "COUNT_UP" as const,
          innerParams: { kind: "COUNT_UP", rounds: 5 },
        },
      ],
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects empty segments array", () => {
    const result = schemeParamsSchema.safeParse({ kind: "TIME_BOXED", segments: [] });

    expect(result.success).toBe(false);
  });

  it("rejects TIME_BOXED as inner archetype (recursive nesting forbidden)", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "TIME_BOXED",
      segments: [
        {
          startSec: 0,
          endSec: 600,
          innerArchetypeKind: "TIME_BOXED",
          innerParams: { kind: "TIME_BOXED", segments: [] },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative startSec", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "TIME_BOXED",
      segments: [
        {
          startSec: -1,
          endSec: 600,
          innerArchetypeKind: "NONE",
          innerParams: { kind: "NONE" },
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — LADDER", () => {
  it("accepts a descending 21-15-9", () => {
    const value = {
      kind: "LADDER" as const,
      sequence: [21, 15, 9],
      direction: "DESC" as const,
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("accepts an ascending 3-6-9-12", () => {
    const value = {
      kind: "LADDER" as const,
      sequence: [3, 6, 9, 12],
      direction: "ASC" as const,
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("accepts a pyramid 3-6-9-12-9-6-3", () => {
    const value = {
      kind: "LADDER" as const,
      sequence: [3, 6, 9, 12, 9, 6, 3],
      direction: "PYRAMID" as const,
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects single-step sequence", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "LADDER",
      sequence: [10],
      direction: "DESC",
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero in sequence", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "LADDER",
      sequence: [0, 5, 10],
      direction: "ASC",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown direction", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "LADDER",
      sequence: [3, 6, 9],
      direction: "RANDOM",
    });

    expect(result.success).toBe(false);
  });
});

describe("schemeParamsSchema — DISTANCE", () => {
  it("accepts a fixed 5km run", () => {
    const value = {
      kind: "DISTANCE" as const,
      unit: "KM" as const,
      distanceMin: 5,
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("accepts a 5-7km range with cap", () => {
    const value = {
      kind: "DISTANCE" as const,
      unit: "KM" as const,
      distanceMin: 5,
      distanceMax: 7,
      capSec: 2400,
    };

    expect(schemeParamsSchema.parse(value)).toEqual(value);
  });

  it("rejects zero distanceMin", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "DISTANCE",
      unit: "KM",
      distanceMin: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown unit", () => {
    const result = schemeParamsSchema.safeParse({
      kind: "DISTANCE",
      unit: "PARSEC",
      distanceMin: 5,
    });

    expect(result.success).toBe(false);
  });
});
