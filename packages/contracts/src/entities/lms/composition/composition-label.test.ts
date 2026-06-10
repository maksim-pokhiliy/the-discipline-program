import { describe, expect, it } from "vitest";

import { compositionLabelSchema, deriveCompositionLabel } from "./composition-label";
import { REPETITION_AXIS_KINDS } from "./composition.constants";
import { compositionSchema } from "./composition.schema";
import type { ArrangementAxis, Composition, RepetitionAxis } from "./composition.types";

const cuidPlaceholder = "clz000000000000placeholder";
const cuidPlank = "clz00000000000000000plankr";

function parsedComposition(composition: Composition): Composition {
  return compositionSchema.parse(composition);
}

describe("deriveCompositionLabel — §2.5 axis-configuration mapping", () => {
  it("maps a structurally parallel composition to parallel / PARALLEL", () => {
    const composition = parsedComposition({});

    expect(deriveCompositionLabel(composition, { containerChildCount: 2 })).toEqual({
      kind: "parallel",
      family: "PARALLEL",
    });
  });

  it("maps arrangement superset to superset / SUPERSET", () => {
    const composition = parsedComposition({
      arrangement: {
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidPlaceholder, cuidPlank] }],
      },
    });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "superset", family: "SUPERSET" });
  });

  it("maps repetition ladder to ladder / LADDER", () => {
    const composition = parsedComposition({ repetition: { kind: "ladder", steps: [21, 15, 9] } });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "ladder", family: "LADDER" });
  });

  it("maps repetition cadence to cadence / INTERVALIC", () => {
    const composition = parsedComposition({
      repetition: { kind: "cadence", everyMin: 1, rounds: 4 },
    });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "cadence", family: "INTERVALIC" });
  });

  it("maps repetition interval to interval / INTERVALIC", () => {
    const composition = parsedComposition({
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
    });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "interval", family: "INTERVALIC" });
  });

  it("maps repetition timeCap to timeCap / TIME_BOUNDED", () => {
    const composition = parsedComposition({
      repetition: { kind: "timeCap", cap: { min: 10, unit: "min" } },
    });

    expect(deriveCompositionLabel(composition)).toEqual({
      kind: "timeCap",
      family: "TIME_BOUNDED",
    });
  });

  it("maps repetition count to rounds / ROUNDS", () => {
    const composition = parsedComposition({ repetition: { kind: "count", count: 3 } });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "rounds", family: "ROUNDS" });
  });

  it("maps repetition once to flat / FLAT", () => {
    const composition = parsedComposition({ repetition: { kind: "once" } });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "flat", family: "FLAT" });
  });

  it("maps an empty composition to flat / FLAT", () => {
    const composition = parsedComposition({});

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "flat", family: "FLAT" });
  });
});

describe("deriveCompositionLabel — canonical gauntlet compositions", () => {
  it("labels Fran (container ladder) as ladder / LADDER", () => {
    const fran = parsedComposition({
      repetition: { kind: "ladder", steps: [21, 15, 9] },
      arrangement: { kind: "ordered" },
    });

    expect(deriveCompositionLabel(fran)).toEqual({ kind: "ladder", family: "LADDER" });
  });

  it("labels Block C (marker rows, no container children) as flat / FLAT", () => {
    const blockC = parsedComposition({});

    expect(deriveCompositionLabel(blockC, { containerChildCount: 0 })).toEqual({
      kind: "flat",
      family: "FLAT",
    });
  });

  it("labels Gauntlet B EMOM (cadence) as cadence / INTERVALIC", () => {
    const emom = parsedComposition({ repetition: { kind: "cadence", everyMin: 1, rounds: 4 } });

    expect(deriveCompositionLabel(emom)).toEqual({ kind: "cadence", family: "INTERVALIC" });
  });

  it("labels Gauntlet A (count + until_recovery rest) as rounds / ROUNDS", () => {
    const waveA = parsedComposition({
      repetition: { kind: "count", count: 3 },
      rest: {
        duration: { value: 1, unit: "sec" },
        scope: "between_rounds",
        qualifier: "until_recovery",
      },
    });

    expect(deriveCompositionLabel(waveA)).toEqual({ kind: "rounds", family: "ROUNDS" });
  });

  it("labels Gauntlet E (superset wins over count repetition) as superset / SUPERSET", () => {
    const supersetE = parsedComposition({
      arrangement: {
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidPlaceholder, cuidPlank] }],
      },
      repetition: { kind: "count", count: 3 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    });

    expect(deriveCompositionLabel(supersetE)).toEqual({ kind: "superset", family: "SUPERSET" });
  });

  it("labels a timeCap container as timeCap / TIME_BOUNDED", () => {
    const timeCapped = parsedComposition({
      repetition: { kind: "timeCap", cap: { min: 12, unit: "min" } },
    });

    expect(deriveCompositionLabel(timeCapped)).toEqual({
      kind: "timeCap",
      family: "TIME_BOUNDED",
    });
  });
});

const cuidPairA = "clz0000000000000000pairaaa";
const cuidPairB = "clz0000000000000000pairbbb";

function repetitionAxisOf(kind: RepetitionAxis["kind"]): RepetitionAxis {
  switch (kind) {
    case "once":
      return { kind: "once" };
    case "count":
      return { kind: "count", count: 3 };
    case "ladder":
      return { kind: "ladder", steps: [21, 15, 9] };
    case "timeCap":
      return { kind: "timeCap", cap: { min: 12, unit: "min" } };
    case "cadence":
      return { kind: "cadence", everyMin: 1, rounds: 4 };
    case "interval":
      return { kind: "interval", workMin: 2, offMin: 1, count: 3 };
  }
}

const ARRANGEMENT_CASES: ReadonlyArray<{ name: string; arrangement: ArrangementAxis | undefined }> =
  [
    { name: "no arrangement", arrangement: undefined },
    { name: "ordered", arrangement: { kind: "ordered" } },
    {
      name: "superset",
      arrangement: { kind: "superset", pairs: [{ label: "A", rowIds: [cuidPairA, cuidPairB] }] },
    },
  ];

describe("deriveCompositionLabel — totality across every axis combination", () => {
  for (const repetitionKind of REPETITION_AXIS_KINDS) {
    for (const arrangementCase of ARRANGEMENT_CASES) {
      it(`derives an enum-valid label for repetition ${repetitionKind} × ${arrangementCase.name}`, () => {
        const composition = parsedComposition({
          repetition: repetitionAxisOf(repetitionKind),
          ...(arrangementCase.arrangement !== undefined && {
            arrangement: arrangementCase.arrangement,
          }),
        });

        const label = deriveCompositionLabel(composition);

        expect(() => compositionLabelSchema.parse(label)).not.toThrow();
        expect(compositionLabelSchema.safeParse(label).success).toBe(true);
      });
    }
  }
});
