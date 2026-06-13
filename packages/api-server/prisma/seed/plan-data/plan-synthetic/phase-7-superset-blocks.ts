import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  percentageLoad,
  percentageRefOtherExercise,
  percentageRefSelf,
  restBetweenRounds,
  rounds,
  rpe,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_PHASE7 = restBetweenRounds({ value: 1, unit: "min" }, "fixed");

export const BLOCK_SUPER_SET_PAIR_A: CanonicalBlock = {
  blockInstanceRef: "block-165",
  order: 1,
  labels: [LBL.accessory],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "super-set A",
        intensity: rpe(8),
        rows: [
          mkRow(1, EX.dbStrictPress, {
            load: percentageLoad(60, percentageRefSelf()),
            reps: countReps(10),
          }),
          mkRow(2, EX.dbCurl, {
            load: percentageLoad(50, percentageRefOtherExercise(EX.backSquat)),
            reps: countReps(12),
          }),
        ],
      },
      {
        ...rounds(3),
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
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "super-set B",
        rows: [
          mkRow(1, EX.dbHammerCurl, {
            load: absoluteLoad({ count: 1, kg: 15 }),
            reps: countReps(12),
          }),
          mkRow(2, EX.bandTricepPushdown, {
            load: bodyweightLoad(),
            reps: countReps(12),
          }),
        ],
      },
      {
        ...rounds(3),
        rest: REST_BETWEEN_ROUNDS_PHASE7,
      },
      null,
    ),
  ],
};
