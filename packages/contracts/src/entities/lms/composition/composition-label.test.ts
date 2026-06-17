import { describe, expect, it } from "vitest";

import { compositionLabelSchema, deriveCompositionLabel } from "./composition-label";
import { REPETITION_AXIS_KINDS } from "./composition.constants";
import { compositionSchema } from "./composition.schema";
import type { Composition, RepetitionAxis } from "./composition.types";

function parsedComposition(composition: Composition): Composition {
  return compositionSchema.parse(composition);
}

describe("deriveCompositionLabel — repetition-only mapping", () => {
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
      repetition: {
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 1, unit: "min" },
        count: 3,
      },
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

  it("ignores rest when deriving the label (still rounds for count + rest)", () => {
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
});

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
      return {
        kind: "interval",
        work: { value: 2, unit: "min" },
        off: { value: 1, unit: "min" },
        count: 3,
      };
  }
}

describe("deriveCompositionLabel — totality across every repetition kind", () => {
  for (const repetitionKind of REPETITION_AXIS_KINDS) {
    it(`derives an enum-valid label for repetition ${repetitionKind}`, () => {
      const composition = parsedComposition({ repetition: repetitionAxisOf(repetitionKind) });

      const label = deriveCompositionLabel(composition);

      expect(() => compositionLabelSchema.parse(label)).not.toThrow();
      expect(compositionLabelSchema.safeParse(label).success).toBe(true);
    });
  }

  it("derives an enum-valid label for an absent repetition axis", () => {
    const label = deriveCompositionLabel(parsedComposition({}));

    expect(compositionLabelSchema.safeParse(label).success).toBe(true);
  });
});

describe("compositionLabelSchema — dead kinds removed", () => {
  it("rejects the dropped parallel kind", () => {
    expect(compositionLabelSchema.safeParse({ kind: "parallel", family: "PARALLEL" }).success).toBe(
      false,
    );
  });

  it("rejects the dropped superset kind", () => {
    expect(compositionLabelSchema.safeParse({ kind: "superset", family: "SUPERSET" }).success).toBe(
      false,
    );
  });
});
