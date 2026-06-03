import { describe, expect, it } from "vitest";

import { deriveCompositionLabel } from "./composition-label";
import { compositionSchema } from "./composition.schema";
import type { Composition } from "./composition.types";

const cuidThrTrack = "clz00000000000000thrtrack1";
const cuidPulTrack = "clz00000000000000pultrack1";
const cuidPlaceholder = "clz000000000000placeholder";
const cuidPlank = "clz00000000000000000plankr";

function parsedComposition(composition: Composition): Composition {
  return compositionSchema.parse(composition);
}

describe("deriveCompositionLabel — §2.5 axis-configuration mapping", () => {
  it("maps arrangement parallel to parallel / PARALLEL", () => {
    const composition = parsedComposition({
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidThrTrack }, { childSchemaId: cuidPulTrack }],
      },
    });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "parallel", family: "PARALLEL" });
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

  it("maps repetition window to window / INTERVALIC", () => {
    const composition = parsedComposition({
      repetition: { kind: "window", startHhMm: "00:00", endHhMm: "00:01" },
    });

    expect(deriveCompositionLabel(composition)).toEqual({ kind: "window", family: "INTERVALIC" });
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

  it("maps repetition range to rounds / ROUNDS", () => {
    const composition = parsedComposition({
      repetition: { kind: "range", range: { min: 3, max: 5 } },
    });

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

  it("labels Block C (parallel tracks) as parallel / PARALLEL", () => {
    const blockC = parsedComposition({
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: cuidThrTrack }, { childSchemaId: cuidPulTrack }],
      },
    });

    expect(deriveCompositionLabel(blockC)).toEqual({ kind: "parallel", family: "PARALLEL" });
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

  it("labels a timeCap + amrap container as timeCap / TIME_BOUNDED", () => {
    const timeCapped = parsedComposition({
      repetition: { kind: "timeCap", cap: { min: 12, unit: "min" } },
      scoring: { kind: "amrap" },
    });

    expect(deriveCompositionLabel(timeCapped)).toEqual({
      kind: "timeCap",
      family: "TIME_BOUNDED",
    });
  });
});

describe("deriveCompositionLabel — scoring is inert and never alters the label", () => {
  it("labels Gauntlet D interval with a max_in_remaining scoring as interval / INTERVALIC", () => {
    const withScoring = parsedComposition({
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      arrangement: { kind: "ordered" },
      scoring: { kind: "max_in_remaining", condition: { appliesToRounds: [2, 3] } },
    });

    expect(deriveCompositionLabel(withScoring)).toEqual({
      kind: "interval",
      family: "INTERVALIC",
    });
  });

  it("derives an identical label for the same interval without any scoring axis", () => {
    const withScoring = parsedComposition({
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      arrangement: { kind: "ordered" },
      scoring: { kind: "max_in_remaining", condition: { appliesToRounds: [2, 3] } },
    });

    const withoutScoring = parsedComposition({
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      arrangement: { kind: "ordered" },
    });

    expect(deriveCompositionLabel(withScoring)).toEqual(deriveCompositionLabel(withoutScoring));
  });
});
