import { describe, expect, it } from "vitest";

import { composeContainerSchema, compositionSchema } from "./composition.schema";
import type { ComposeRow } from "./composition.types";

const cuidEmom = "clz000000000000000000emom";
const cuidPullups = "clz00000000000000000pullup";
const cuidDips = "clz0000000000000000000dips";
const cuidRowRest = "clz00000000000000000restrw";

const cuidIntervalD = "clz0000000000000interval_d";
const cuidKbSwings = "clz00000000000000kbswingsr";
const cuidPushPress = "clz0000000000000pushpressr";
const cuidWallBalls = "clz0000000000000wallballsr";

const cuidWaveA = "clz000000000000000000wavea";
const cuidBackSquat = "clz0000000000000backsquatr";
const cuidBoxJumps = "clz00000000000000boxjumpsr";

const cuidCashOut = "clz0000000000000000cashout";
const cuidRun800 = "clz00000000000000000run800";

function exerciseRow(id: string, exerciseId: string): ComposeRow {
  return {
    nodeType: "row",
    id,
    exerciseId,
    reps: null,
    load: null,
    side: null,
    tempo: null,
    media: null,
    notes: null,
  };
}

describe("Gauntlet B — EMOM / 4 rounds (cadence over a flat row set)", () => {
  const restMinRow = exerciseRow(cuidRowRest, cuidRowRest);

  const emomContainer = {
    nodeType: "container" as const,
    id: cuidEmom,
    header: "EMOM 16",
    notes: null,
    composition: { repetition: { kind: "cadence" as const, everyMin: 1, rounds: 4 } },
    children: [exerciseRow(cuidPullups, cuidPullups), exerciseRow(cuidDips, cuidDips), restMinRow],
  };

  it("expresses the outer cadence(everyMin:1, rounds:4) as a composition bundle", () => {
    expect(
      compositionSchema.safeParse({ repetition: { kind: "cadence", everyMin: 1, rounds: 4 } })
        .success,
    ).toBe(true);
  });

  it("validates a flat cadence container whose children are rows only", () => {
    expect(composeContainerSchema.safeParse(emomContainer).success).toBe(true);
  });

  it("rejects a container whose children include a nested container (recursion is dead)", () => {
    expect(
      composeContainerSchema.safeParse({
        ...emomContainer,
        children: [emomContainer],
      }).success,
    ).toBe(false);
  });
});

describe("Gauntlet D — 3x(2min work / 1min off) interval, flat rows", () => {
  const intervalContainer = {
    nodeType: "container" as const,
    id: cuidIntervalD,
    header: "MAX wall balls",
    notes: null,
    composition: { repetition: { kind: "interval" as const, workMin: 2, offMin: 1, count: 3 } },
    children: [
      exerciseRow(cuidKbSwings, cuidKbSwings),
      exerciseRow(cuidPushPress, cuidPushPress),
      exerciseRow(cuidWallBalls, cuidWallBalls),
    ],
  };

  it("expresses interval(work:2, off:1, count:3) as a bundle", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      }).success,
    ).toBe(true);
  });

  it("validates the interval container with flat rows", () => {
    expect(composeContainerSchema.safeParse(intervalContainer).success).toBe(true);
  });
});

describe("Gauntlet A — back squat wave + box jumps, rest until recovery (sham-duration convention)", () => {
  const waveRow: ComposeRow = {
    nodeType: "row",
    id: cuidBackSquat,
    exerciseId: cuidBackSquat,
    reps: { kind: "count", value: 5 },
    load: null,
    side: null,
    tempo: { eccentric: 3, pauseBottom: 1, concentric: "X", pauseTop: 0 },
    media: null,
    notes: null,
  };

  const boxJumpsRow: ComposeRow = {
    nodeType: "row",
    id: cuidBoxJumps,
    exerciseId: cuidBoxJumps,
    reps: { kind: "count", value: 10 },
    load: null,
    side: null,
    tempo: null,
    media: null,
    notes: ["from sofa"],
  };

  const waveContainer = {
    nodeType: "container" as const,
    id: cuidWaveA,
    header: "Back squat wave",
    notes: null,
    composition: {
      repetition: { kind: "count" as const, count: 3 },
      rest: {
        duration: { value: 1, unit: "sec" as const },
        scope: "between_rounds" as const,
        qualifier: "until_recovery" as const,
      },
    },
    children: [waveRow, boxJumpsRow],
  };

  it("represents rest until recovery via the sham fixed duration plus the until_recovery qualifier", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "count", count: 3 },
        rest: {
          duration: { value: 1, unit: "sec" },
          scope: "between_rounds",
          qualifier: "until_recovery",
        },
      }).success,
    ).toBe(true);
  });

  it("validates the count(3) container with both children as a composeContainerSchema node", () => {
    expect(composeContainerSchema.safeParse(waveContainer).success).toBe(true);
  });
});

describe("Gauntlet E — cash-out OR (sequence as flat rows)", () => {
  const placeholderRow: ComposeRow = {
    nodeType: "row",
    id: "clz000000000000placeholder",
    exerciseId: "clz000000000000placeholder",
    reps: { kind: "count", value: 12 },
    load: null,
    side: null,
    tempo: null,
    media: null,
    notes: ["biceps/triceps"],
  };

  const cashOutRow: ComposeRow = {
    nodeType: "row",
    id: cuidCashOut,
    exerciseId: cuidRun800,
    reps: { kind: "unit_bound", unit: "km", value: 0.8 },
    load: null,
    side: null,
    tempo: null,
    media: null,
    notes: ["OR row 1000m"],
  };

  const sequenceContainer = {
    nodeType: "container" as const,
    id: "clz0000000000000superset_e",
    header: "Accessory + cash-out",
    notes: null,
    composition: {
      repetition: { kind: "count" as const, count: 3 },
      rest: { duration: { value: 90, unit: "sec" as const }, scope: "between_sets" as const },
    },
    children: [placeholderRow, cashOutRow],
  };

  it("expresses the cash-out as a plain exercise row (OR re-expressed as a row-group note)", () => {
    expect(composeContainerSchema.safeParse(sequenceContainer).success).toBe(true);
  });

  it("rejects a compose row carrying the dropped rowPayload union", () => {
    expect(
      composeContainerSchema.safeParse({
        ...sequenceContainer,
        children: [
          {
            ...cashOutRow,
            rowKind: "EXERCISE",
            rowPayload: {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: cuidRun800 },
            },
          },
        ],
      }).success,
    ).toBe(false);
  });
});
