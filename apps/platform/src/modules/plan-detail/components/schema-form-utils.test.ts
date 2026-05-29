import type { FieldError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { ArchetypeName } from "@repo/contracts/lms/schema";

import { buildIntensityCandidate, parseArchetypeParams } from "./schema-form-utils";

const isFieldError = (node: unknown): node is FieldError =>
  typeof node === "object" && node !== null && "message" in node;

const readMessage = (node: unknown): string | undefined => {
  if (isFieldError(node) && typeof node.message === "string") {
    return node.message;
  }

  return undefined;
};

const readBranch = (node: unknown, key: string): unknown =>
  typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined;

type ValidCase = { name: string; archetype: ArchetypeName; params: unknown };

const VALID_CASES: ValidCase[] = [
  { name: "n-rounds exact", archetype: "n-rounds", params: { countForm: "exact", count: 5 } },
  {
    name: "n-rounds range",
    archetype: "n-rounds",
    params: { countForm: "range", countRange: { min: 3, max: 5 } },
  },
  {
    name: "n-rounds count_times_reps",
    archetype: "n-rounds",
    params: { countForm: "count_times_reps", count: 5, repsPerSet: 8 },
  },
  { name: "ladder-descending", archetype: "ladder-descending", params: { steps: [21, 15, 9] } },
  { name: "ladder-ascending", archetype: "ladder-ascending", params: { steps: [1, 2, 3] } },
  { name: "amrap-flat", archetype: "amrap-flat", params: { durationMin: 12 } },
  {
    name: "run-distance decimal value",
    archetype: "run-distance",
    params: { modality: "RUN", distance: { unit: "km", value: 5.5 } },
  },
  {
    name: "emom-slot single",
    archetype: "emom-sub-minute-slot",
    params: { slot: { kind: "single", minute: 1 } },
  },
  {
    name: "emom-slot grouped",
    archetype: "emom-sub-minute-slot",
    params: { slot: { kind: "grouped", minutes: [1, 3, 5] } },
  },
  {
    name: "named-themed-sets",
    archetype: "named-themed-sets",
    params: { count: 4, theme: "Benchmark WODs" },
  },
  { name: "empty single-line-bare", archetype: "single-line-bare", params: {} },
  { name: "empty flat-list-headerless", archetype: "flat-list-headerless", params: {} },
];

describe("parseArchetypeParams accepts valid params per representative archetype (QA-Must-1)", () => {
  it.each(VALID_CASES)(
    "returns ok with the discriminated archetypeParams for $name",
    ({ archetype, params }) => {
      const result = parseArchetypeParams(archetype, params);

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value).toEqual({ archetype, params });
      }
    },
  );
});

describe("parseArchetypeParams maps invalid params to the field path the form reads (QA-Must-1)", () => {
  it("maps an empty theme to error.theme.message", () => {
    const result = parseArchetypeParams("named-themed-sets", { count: 4, theme: "" });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.theme)).toBe("String must contain at least 1 character(s)");
    }
  });

  it("maps an n-rounds range min>=max to error.countRange.root.message (contract refine has no path)", () => {
    const result = parseArchetypeParams("n-rounds", {
      countForm: "range",
      countRange: { min: 9, max: 3 },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.countRange, "root"))).toBe(
        "countRange.min must be less than countRange.max",
      );
    }
  });

  it("maps a named-themed-sets count range min>=max to error.count.root.message", () => {
    const result = parseArchetypeParams("named-themed-sets", {
      count: { min: 9, max: 3 },
      theme: "X",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.count, "root"))).toBe(
        "range.min must be less than range.max",
      );
    }
  });

  it("rejects an equal-bound count range (strict <) with the same root message", () => {
    const result = parseArchetypeParams("named-themed-sets", {
      count: { min: 5, max: 5 },
      theme: "X",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.count, "root"))).toBe(
        "range.min must be less than range.max",
      );
    }
  });

  it("maps a grouped emom slot of 1 minute to error.slot.minutes.root.message", () => {
    const result = parseArchetypeParams("emom-sub-minute-slot", {
      slot: { kind: "grouped", minutes: [1] },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const minutes = readBranch(result.error.slot, "minutes");

      expect(readMessage(readBranch(minutes, "root"))).toBe(
        "Array must contain at least 2 element(s)",
      );
    }
  });

  it("maps empty steps of an empty ladder element to error.steps[0].message", () => {
    const result = parseArchetypeParams("ladder-descending", { steps: [0] });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.steps, "0"))).toBe(
        "Number must be greater than 0",
      );
    }
  });

  it("maps a zero positiveInt to its field message", () => {
    const result = parseArchetypeParams("emom-nested-per-minute", { durationMin: 10, rounds: 0 });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.rounds)).toBe("Number must be greater than 0");
    }
  });

  it("maps a negative positiveInt array element to its field message", () => {
    const result = parseArchetypeParams("alternating-sets", { setEnumeration: [-1] });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(readBranch(result.error.setEnumeration, "0"))).toBe(
        "Number must be greater than 0",
      );
    }
  });
});

describe("parseArchetypeParams keeps the message for whole-params failures (QA-3 regression)", () => {
  it("maps an extra key on an empty .strict() schema to a defined error.root.message", () => {
    const result = parseArchetypeParams("single-line-bare", { x: 1 });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const message = readMessage(result.error.root);

      expect(message).toBeDefined();
      expect(typeof message).toBe("string");
      expect(message?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("keeps a defined error.root.message when params is not an object at all", () => {
    const result = parseArchetypeParams("n-rounds", [1, 2, 3]);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(readMessage(result.error.root)).toBeDefined();
    }
  });
});

describe("parseArchetypeParams never throws on hostile input (QA-7)", () => {
  const HOSTILE: unknown[] = [null, undefined, [1, 2, 3], "hello", 42];

  it.each(HOSTILE.map((value) => ({ value })))(
    "returns ok:false without throwing for %o",
    ({ value }) => {
      let result: ReturnType<typeof parseArchetypeParams> | undefined;

      expect(() => {
        result = parseArchetypeParams("n-rounds", value);
      }).not.toThrow();
      expect(result?.ok).toBe(false);
    },
  );
});

describe("buildIntensityCandidate strips undefined axes", () => {
  it("returns an empty object when every axis is undefined", () => {
    expect(buildIntensityCandidate({})).toEqual({});
  });

  it("includes only the axes that are defined", () => {
    expect(buildIntensityCandidate({ rpe: { value: 8 }, pace: undefined })).toEqual({
      rpe: { value: 8 },
    });
  });

  it("preserves every axis when all are set", () => {
    const candidate = buildIntensityCandidate({
      effortPercent: { value: 80 },
      rpe: { value: 8 },
      pace: "moderate",
      hrZone: { zone: "Z2" },
      numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
    });

    expect(candidate).toEqual({
      effortPercent: { value: 80 },
      rpe: { value: 8 },
      pace: "moderate",
      hrZone: { zone: "Z2" },
      numericPace: { value: "5:00", distanceUnit: "km", paceType: "min_per_distance" },
    });
  });
});
