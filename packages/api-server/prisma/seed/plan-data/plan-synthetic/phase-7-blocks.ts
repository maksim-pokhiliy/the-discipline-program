import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  cuidFromSeed,
  fullTempo,
  hrZone,
  numericPace,
  percentageLoad,
  percentageRefMovementFamily,
  percentageRefOtherExercise,
  percentageRefSelf,
  restBetweenIntervals,
  restBetweenRounds,
  rounds,
  rpe,
  singleWeight,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_HR_Z2_RUN: CanonicalBlock = {
  blockInstanceRef: "block-160",
  order: 1,
  labels: [LBL.endurance],
  intensity: hrZone("Z2"),
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "HR Z2 base run 60 min",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.run } },
            { reps: unitBoundReps({ unit: "min", value: 60 }), intensity: hrZone("Z2") },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.run } },
            { reps: unitBoundReps({ unit: "min", value: 5 }), intensity: hrZone("Z1") },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_NUMERIC_PACE_ROW: CanonicalBlock = {
  blockInstanceRef: "block-161",
  order: 1,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Row intervals at numeric pace",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.rowErg } },
            {
              reps: unitBoundReps({ unit: "min", value: 5 }),
              intensity: {
                numericPace: { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" },
                hrZone: { zone: "Z3" },
              },
            },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.rowErg } },
            {
              reps: unitBoundReps({ unit: "min", value: 3 }),
              intensity: {
                numericPace: { value: "240", distanceUnit: "km", paceType: "distance_per_min" },
                hrZone: { zone: "Z4" },
              },
            },
          ),
          mkRow(
            3,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.rowErg } },
            {
              reps: unitBoundReps({ unit: "min", value: 1 }),
              intensity: {
                hrZone: { zone: "Z5" },
                ...numericPace({ value: "1:40", distanceUnit: "m", paceType: "min_per_distance" }),
              },
            },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_TEMPO_BACK_SQUAT: CanonicalBlock = {
  blockInstanceRef: "block-162",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Tempo Back Squat 75% self",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.backSquat } },
            {
              load: percentageLoad(75, percentageRefSelf()),
              reps: countReps(5),
              tempo: fullTempo({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 }),
            },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_SNATCH_WAVE: CanonicalBlock = {
  blockInstanceRef: "block-163",
  order: 1,
  labels: [LBL.olympic],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Snatch wave 70/80/90",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.bbSnatch } },
            {
              load: percentageLoad(70, percentageRefSelf()),
              reps: countReps(3),
              intensity: rpe(7),
            },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

const REST_BETWEEN_INTERVALS_SEC = restBetweenIntervals({ value: 15, unit: "sec" }, "fixed");

export const BLOCK_PULL_UP_CLUSTER: CanonicalBlock = {
  blockInstanceRef: "block-164",
  order: 1,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: { min: 15, unit: "sec" },
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "strict pull-up cluster 5 × (3+3+3)",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictPullUp } },
            { load: bodyweightLoad(), reps: countReps(3) },
          ),
          mkRow(2, {
            rowKind: "REST",
            raw: "15 sec between intervals",
            parsed: REST_BETWEEN_INTERVALS_SEC,
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

const SUPER_PAIR_A = cuidFromSeed("super-set::pair::a");
const SUPER_PAIR_B = cuidFromSeed("super-set::pair::b");
const SUPER_PAIR_B_ROW = cuidFromSeed("super-set::pair::b-row");
const SUPER_PAIR_B_ROW_2 = cuidFromSeed("super-set::pair::b-row-2");
const REST_BETWEEN_ROUNDS_PHASE7 = restBetweenRounds({ value: 1, unit: "min" }, "fixed");

export const BLOCK_SUPER_SET_PAIR_A: CanonicalBlock = {
  blockInstanceRef: "block-165",
  order: 1,
  labels: [LBL.accessory],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "super-set A",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbStrictPress } },
            {
              refId: SUPER_PAIR_A,
              load: percentageLoad(60, percentageRefMovementFamily("press")),
              reps: countReps(10),
              intensity: rpe(8),
            },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbCurl } },
            {
              refId: SUPER_PAIR_B,
              load: percentageLoad(50, percentageRefOtherExercise(EX.backSquat)),
              reps: countReps(12),
            },
          ),
        ],
      },
      {
        ...rounds(3),
        arrangement: {
          kind: "superset",
          pairs: [{ label: "Pair A", rowIds: [SUPER_PAIR_A, SUPER_PAIR_B] }],
        },
        rest: REST_BETWEEN_ROUNDS_PHASE7,
      },
      null,
    ),
  ],
};

export const BLOCK_SUPER_SET_PAIR_B: CanonicalBlock = {
  blockInstanceRef: "block-166",
  order: 2,
  labels: [LBL.accessory],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "super-set B",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbHammerCurl } },
            {
              refId: SUPER_PAIR_B_ROW,
              load: absoluteLoad(singleWeight(15)),
              reps: countReps(12),
            },
          ),
          mkRow(
            2,
            {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: EX.bandTricepPushdown },
            },
            {
              refId: SUPER_PAIR_B_ROW_2,
              load: bodyweightLoad(),
              reps: countReps(12),
            },
          ),
        ],
      },
      {
        ...rounds(3),
        arrangement: {
          kind: "superset",
          pairs: [{ label: "Pair B", rowIds: [SUPER_PAIR_B_ROW, SUPER_PAIR_B_ROW_2] }],
        },
        rest: REST_BETWEEN_ROUNDS_PHASE7,
      },
      null,
    ),
  ],
};
