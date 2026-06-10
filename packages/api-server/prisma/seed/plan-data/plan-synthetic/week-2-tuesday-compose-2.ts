import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  ladderRep,
  singleWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_TIME_WINDOW_OUTER_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-003",
  order: 5,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "20-min time window",
      },
      { repetition: { kind: "timeCap", cap: { min: 20, unit: "min" } } },
      null,
    ),
  ],
};

export const BLOCK_PULL_UPS_DIPS_CYCLE_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-182",
  order: 6,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "pull-ups + dips cycle",
        rows: [
          mkRow(
            1,
            {
              rowKind: "EXERCISE",
              exercise: {
                form: "cyclical",
                cyclical: {
                  primaryExerciseId: EX.strictPullUp,
                  secondaryExerciseId: EX.barDip,
                  cycles: [
                    { primaryReps: 5, secondaryReps: 5 },
                    { primaryReps: 4, secondaryReps: 6 },
                    { primaryReps: 3, secondaryReps: 7 },
                  ],
                },
              },
            },
            { load: bodyweightLoad() },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_PARALLEL_PYRAMIDS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-087",
  order: 7,
  labels: [LBL.olympic],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "parallel pyramids",
        subSchemas: [
          buildComposeNode(
            {
              order: 1,
              rows: [
                mkRow(
                  1,
                  { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerSnatch } },
                  { load: absoluteLoad(singleWeight(50)) },
                ),
              ],
            },
            ladderRep([3, 5, 3]),
            null,
          ),
          buildComposeNode(
            {
              order: 2,
              rows: [
                mkRow(
                  1,
                  { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerSnatch } },
                  { load: absoluteLoad(singleWeight(50)) },
                ),
              ],
            },
            ladderRep([5, 7, 5]),
            null,
          ),
        ],
      },
      {},
      null,
    ),
  ],
};
