import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  cuidFromSeed,
  percentageLoad,
  percentageRefMovementFamily,
  percentageRefOtherExercise,
  restBetweenRounds,
  rounds,
  rpe,
  singleWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

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
