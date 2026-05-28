import {
  absoluteLoad,
  bodyweightLoad,
  countReps,
  cuidFromSeed,
  fullTempo,
  hrZone,
  namedExerciseProgram,
  numericPace,
  percentageLoad,
  percentageRefMovementFamily,
  percentageRefOtherExercise,
  percentageRefSelf,
  restBetweenIntervals,
  restBetweenRounds,
  rpe,
  runDistance,
  singleWeight,
  superSet,
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
    runDistance({
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
    }),
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
    runDistance({
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
    }),
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
    namedExerciseProgram({
      order: 1,
      exerciseId: EX.backSquat,
      program: {
        programKind: "drop_set",
        stages: [{ reps: 5, load: percentageLoad(75, percentageRefSelf()) }],
      },
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
    }),
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
    namedExerciseProgram({
      order: 1,
      exerciseId: EX.bbSnatch,
      program: {
        programKind: "wave",
        stages: [
          { reps: 3, load: percentageLoad(70, percentageRefSelf()) },
          { reps: 2, load: percentageLoad(80, percentageRefSelf()) },
          { reps: 1, load: percentageLoad(90, percentageRefSelf()) },
        ],
      },
      header: "Snatch wave 70/80/90",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.bbSnatch } },
          { load: percentageLoad(70, percentageRefSelf()), reps: countReps(3), intensity: rpe(7) },
        ),
      ],
    }),
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
    namedExerciseProgram({
      order: 1,
      exerciseId: EX.strictPullUp,
      program: {
        programKind: "cluster",
        stages: [{ reps: 3 }, { reps: 3 }, { reps: 3 }],
        setsCount: 5,
        stageCountPerSet: 3,
        restBetweenStages: REST_BETWEEN_INTERVALS_SEC,
      },
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
    }),
  ],
};

const SUPER_PAIR_A = cuidFromSeed("super-set::pair::a");
const SUPER_PAIR_B = cuidFromSeed("super-set::pair::b");
const REST_BETWEEN_ROUNDS_PHASE7 = restBetweenRounds({ value: 1, unit: "min" }, "fixed");

export const BLOCK_SUPER_SET_PAIR_A: CanonicalBlock = {
  blockInstanceRef: "block-165",
  order: 1,
  labels: [LBL.accessory],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    superSet({
      order: 1,
      rounds: 3,
      restBetweenPairs: REST_BETWEEN_ROUNDS_PHASE7,
      pairs: [{ label: "Pair A", schemaRows: [SUPER_PAIR_A, SUPER_PAIR_B] }],
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
    }),
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
    superSet({
      order: 1,
      rounds: 3,
      restBetweenPairs: REST_BETWEEN_ROUNDS_PHASE7,
      pairs: [{ label: "Pair B", schemaRows: [cuidFromSeed("super-set::pair::b-row")] }],
      header: "super-set B",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbHammerCurl } },
          {
            refId: cuidFromSeed("super-set::pair::b-row"),
            load: absoluteLoad(singleWeight(15)),
            reps: countReps(12),
          },
        ),
      ],
    }),
  ],
};
