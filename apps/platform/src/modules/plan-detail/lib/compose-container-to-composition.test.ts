import { describe, expect, it } from "vitest";

import { compositionSchema } from "@repo/contracts/lms/composition";

import type { RepetitionAxis, SchemaDraft } from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";
import { composeContainerToComposition } from "./compose-container-to-composition";

const container = (overrides: Partial<SchemaDraft>): SchemaDraft => ({
  id: asNodeId("flat-container"),
  header: null,
  notes: null,
  rows: [],
  ...overrides,
});

const repetitionContainer = (repetition: RepetitionAxis): SchemaDraft => container({ repetition });

describe("composeContainerToComposition flat repetition mapping", () => {
  it("round-trips a count repetition as a number", () => {
    expect(composeContainerToComposition(repetitionContainer({ kind: "count", count: 5 }))).toEqual(
      {
        repetition: { kind: "count", count: 5 },
      },
    );
  });

  it("round-trips a count repetition as a min/max range", () => {
    expect(
      composeContainerToComposition(
        repetitionContainer({ kind: "count", count: { min: 3, max: 5 } }),
      ),
    ).toEqual({ repetition: { kind: "count", count: { min: 3, max: 5 } } });
  });

  it("round-trips ladder, cadence, interval and timeCap repetitions", () => {
    const cases: { repetition: RepetitionAxis; expected: unknown }[] = [
      {
        repetition: { kind: "ladder", steps: [21, 15, 9] },
        expected: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      },
      {
        repetition: { kind: "cadence", everyMin: 1, rounds: 16 },
        expected: { repetition: { kind: "cadence", everyMin: 1, rounds: 16 } },
      },
      {
        repetition: {
          kind: "interval",
          work: { value: 2, unit: "min" },
          off: { value: 1, unit: "min" },
          count: 3,
        },
        expected: {
          repetition: {
            kind: "interval",
            work: { value: 2, unit: "min" },
            off: { value: 1, unit: "min" },
            count: 3,
          },
        },
      },
      {
        repetition: { kind: "timeCap", cap: { min: 5, unit: "min" } },
        expected: { repetition: { kind: "timeCap", cap: { min: 5, unit: "min" } } },
      },
    ];

    for (const { repetition, expected } of cases) {
      expect(composeContainerToComposition(repetitionContainer(repetition))).toEqual(expected);
    }
  });

  it("maps rest through unchanged", () => {
    const rest = { duration: { value: 90, unit: "sec" }, scope: "between_sets" } as const;
    const composition = composeContainerToComposition(container({ rest }));

    expect(composition).toEqual({ rest });
  });

  it("emits exactly {} for a bare container with no axes", () => {
    expect(composeContainerToComposition(container({}))).toEqual({});
  });
});

describe("composeContainerToComposition produces contract-valid compositions", () => {
  const valid: RepetitionAxis[] = [
    { kind: "once" },
    { kind: "count", count: 5 },
    { kind: "count", count: { min: 3, max: 5 } },
    { kind: "ladder", steps: [21, 15, 9] },
    { kind: "cadence", everyMin: 1, rounds: 16 },
    {
      kind: "interval",
      work: { value: 2, unit: "min" },
      off: { value: 1, unit: "min" },
      count: 3,
    },
    { kind: "timeCap", cap: { min: 5, unit: "min" } },
  ];

  it.each(valid)("safeParse accepts the composition for %j", (repetition) => {
    const composition = composeContainerToComposition(repetitionContainer(repetition));

    expect(compositionSchema.safeParse(composition).success).toBe(true);
  });
});
