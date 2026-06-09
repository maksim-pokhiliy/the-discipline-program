import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../schema-row";

import { composeContainerSchema, compositionSchema } from "./composition.schema";
import type { ComposeNode, ComposeRow } from "./composition.types";

const cuidEmom = "clz000000000000000000emom";
const cuidMin1 = "clz000000000000000000min1";
const cuidMin2 = "clz000000000000000000min2";
const cuidMin3 = "clz000000000000000000min3";
const cuidMin4 = "clz000000000000000000min4";
const cuidPullups = "clz00000000000000000pullup";
const cuidDips = "clz0000000000000000000dips";
const cuidRowCompound = "clz0000000000000compoundrw";
const cuidRowRest = "clz00000000000000000restrw";

const cuidIntervalD = "clz0000000000000interval_d";
const cuidKbSwings = "clz00000000000000kbswingsr";
const cuidPushPress = "clz0000000000000pushpressr";
const cuidWallBalls = "clz0000000000000wallballsr";

const cuidWaveA = "clz000000000000000000wavea";
const cuidBackSquat = "clz0000000000000backsquatr";
const cuidBoxJumps = "clz00000000000000boxjumpsr";

const cuidSupersetE = "clz0000000000000superset_e";
const cuidPlaceholder = "clz000000000000placeholder";
const cuidPlank = "clz00000000000000000plankr";
const cuidCashOut = "clz0000000000000000cashout";
const cuidRun800 = "clz00000000000000000run800";
const cuidRow1000 = "clz0000000000000000row1000";

const cuidDeepLeaf = "clz0000000000000000deepleaf";

function exerciseRow(id: string, exerciseId: string): ComposeRow {
  return {
    nodeType: "row",
    id,
    rowKind: "EXERCISE",
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId } },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };
}

describe("Gauntlet B — EMOM 16 / 4 rounds (outer cadence + per-minute child containers)", () => {
  const compoundMinRow: ComposeRow = {
    nodeType: "row",
    id: cuidRowCompound,
    rowKind: "REP_DEFINITION",
    rowPayload: {
      rowKind: "REP_DEFINITION",
      equality: {
        form: "inline_equality",
        totalReps: 1,
        composition: [
          { exerciseId: cuidPullups, count: 5 },
          { exerciseId: cuidDips, count: 10 },
        ],
      },
    },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };

  const restMinRow: ComposeRow = {
    nodeType: "row",
    id: cuidRowRest,
    rowKind: "REST_SLOT",
    rowPayload: { rowKind: "REST_SLOT" },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };

  const minuteWindow: ComposeNode = {
    nodeType: "container",
    id: cuidMin1,
    header: null,
    notes: null,
    composition: {},
    children: [exerciseRow(cuidPullups, cuidPullups)],
  };

  const compoundMinute: ComposeNode = {
    nodeType: "container",
    id: cuidMin2,
    header: null,
    notes: null,
    composition: {},
    children: [compoundMinRow],
  };

  const restMinute: ComposeNode = {
    nodeType: "container",
    id: cuidMin4,
    header: null,
    notes: null,
    composition: {},
    children: [restMinRow],
  };

  const emomContainer: ComposeNode = {
    nodeType: "container",
    id: cuidEmom,
    header: "EMOM 16",
    notes: null,
    composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 4 } },
    children: [
      minuteWindow,
      compoundMinute,
      {
        nodeType: "container",
        id: cuidMin3,
        header: null,
        notes: null,
        composition: {},
        children: [exerciseRow(cuidDips, cuidDips)],
      },
      restMinute,
    ],
  };

  it("expresses the outer cadence(everyMin:1, rounds:4) as a composition bundle", () => {
    expect(
      compositionSchema.safeParse({ repetition: { kind: "cadence", everyMin: 1, rounds: 4 } })
        .success,
    ).toBe(true);
  });

  it("expresses the compound minute via a REP_DEFINITION row payload (5 pull-ups + 10 dips = 1)", () => {
    expect(schemaRowPayloadSchema.safeParse(compoundMinRow.rowPayload).success).toBe(true);
  });

  it("validates the whole container-in-container EMOM as a composeContainerSchema node", () => {
    expect(composeContainerSchema.safeParse(emomContainer).success).toBe(true);
  });
});

describe("Gauntlet D — 3x(2min work / 1min off) interval, ordered children", () => {
  const intervalContainer: ComposeNode = {
    nodeType: "container",
    id: cuidIntervalD,
    header: "MAX wall balls",
    notes: null,
    composition: {
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      arrangement: { kind: "ordered" },
    },
    children: [
      exerciseRow(cuidKbSwings, cuidKbSwings),
      exerciseRow(cuidPushPress, cuidPushPress),
      exerciseRow(cuidWallBalls, cuidWallBalls),
    ],
  };

  it("expresses interval(work:2, off:1, count:3) with an ordered-arrangement bundle", () => {
    expect(
      compositionSchema.safeParse({
        repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
        arrangement: { kind: "ordered" },
      }).success,
    ).toBe(true);
  });

  it("validates the ordered-children interval container as a composeContainerSchema node", () => {
    expect(composeContainerSchema.safeParse(intervalContainer).success).toBe(true);
  });
});

describe("Gauntlet A — back squat wave + box jumps, rest until recovery (sham-duration convention)", () => {
  const waveRow: ComposeRow = {
    nodeType: "row",
    id: cuidBackSquat,
    rowKind: "EXERCISE",
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: cuidBackSquat } },
    reps: { kind: "count", value: 5 },
    load: null,
    side: null,
    tempo: { fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 } },
    position: null,
    intensity: null,
    notes: null,
  };

  const boxJumpsRow: ComposeRow = {
    nodeType: "row",
    id: cuidBoxJumps,
    rowKind: "EXERCISE",
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: cuidBoxJumps } },
    reps: { kind: "count", value: 10 },
    load: null,
    side: null,
    tempo: null,
    position: "FROM_SOFA",
    intensity: null,
    notes: null,
  };

  const waveContainer: ComposeNode = {
    nodeType: "container",
    id: cuidWaveA,
    header: "Back squat wave",
    notes: null,
    composition: {
      repetition: { kind: "count", count: 3 },
      rest: {
        duration: { value: 1, unit: "sec" },
        scope: "between_rounds",
        qualifier: "until_recovery",
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

describe("Gauntlet E — superset / cash-out OR", () => {
  const placeholderRow: ComposeRow = {
    nodeType: "row",
    id: cuidPlaceholder,
    rowKind: "PLACEHOLDER",
    rowPayload: {
      rowKind: "PLACEHOLDER",
      placeholder: { placeholderKind: "coach_choice_slot", text: "biceps/triceps" },
    },
    reps: { kind: "count", value: 12 },
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };

  const plankRow: ComposeRow = {
    nodeType: "row",
    id: cuidPlank,
    rowKind: "EXERCISE",
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: cuidPlank } },
    reps: { kind: "unit_bound", unit: "sec", value: 45 },
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };

  const cashOutRow: ComposeRow = {
    nodeType: "row",
    id: cuidCashOut,
    rowKind: "EXERCISE",
    rowPayload: {
      rowKind: "EXERCISE",
      exercise: {
        form: "or_alternative",
        orAlternative: {
          primaryExerciseId: cuidRun800,
          primaryReps: { kind: "unit_bound", unit: "km", value: 0.8 },
          alternativeExerciseId: cuidRow1000,
          alternativeReps: { kind: "unit_bound", unit: "km", value: 1 },
          purpose: "coach_choice",
        },
      },
    },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };

  const supersetContainer: ComposeNode = {
    nodeType: "container",
    id: cuidSupersetE,
    header: "Superset + cash-out",
    notes: null,
    composition: {
      arrangement: {
        kind: "superset",
        pairs: [{ label: "A", rowIds: [cuidPlaceholder, cuidPlank] }],
      },
      repetition: { kind: "count", count: 3 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
    },
    children: [placeholderRow, plankRow, cashOutRow],
  };

  it("expresses superset pairs with count(3) and a 90s between_sets rest bundle", () => {
    expect(
      compositionSchema.safeParse({
        arrangement: {
          kind: "superset",
          pairs: [{ label: "A", rowIds: [cuidPlaceholder, cuidPlank] }],
        },
        repetition: { kind: "count", count: 3 },
        rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
      }).success,
    ).toBe(true);
  });

  it("expresses the cash-out as an or_alternative EXERCISE row payload", () => {
    expect(schemaRowPayloadSchema.safeParse(cashOutRow.rowPayload).success).toBe(true);
  });

  it("validates the superset container with placeholder, plank and cash-out rows", () => {
    expect(composeContainerSchema.safeParse(supersetContainer).success).toBe(true);
  });
});

describe("recursion exercised beyond depth 1", () => {
  function nestContainers(depth: number): ComposeNode {
    let node: ComposeNode = exerciseRow(cuidDeepLeaf, cuidDeepLeaf);

    for (let level = 0; level < depth; level += 1) {
      node = {
        nodeType: "container",
        id: cuidDeepLeaf,
        header: null,
        notes: null,
        composition: { repetition: { kind: "count", count: 1 } },
        children: [node],
      };
    }

    return node;
  }

  it("validates an eight-deep container tree down to a single EXERCISE row leaf", () => {
    expect(composeContainerSchema.safeParse(nestContainers(8)).success).toBe(true);
  });
});
