import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  composeGroup,
  composeRowGroup,
  countReps,
  ladderRep,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_TIME_WINDOW_OUTER_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-003",
  order: 5,
  labels: [LBL.conditioning],
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
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "pull-ups + dips cycle",
        rows: [
          mkRow(1, EX.strictPullUp, { load: bodyweightLoad(), reps: countReps(5), refId: "cyc-1" }),
          mkRow(2, EX.barDip, { load: bodyweightLoad(), reps: countReps(5), refId: "cyc-2" }),
          mkRow(3, EX.strictPullUp, { load: bodyweightLoad(), reps: countReps(4), refId: "cyc-3" }),
          mkRow(4, EX.barDip, { load: bodyweightLoad(), reps: countReps(6), refId: "cyc-4" }),
          mkRow(5, EX.strictPullUp, { load: bodyweightLoad(), reps: countReps(3), refId: "cyc-5" }),
          mkRow(6, EX.barDip, { load: bodyweightLoad(), reps: countReps(7), refId: "cyc-6" }),
        ],
        rowGroups: [
          composeRowGroup({
            refId: "cycle-group",
            notes: ["Cycle pull-ups/dips: 5-5, 4-6, 3-7"],
            memberRowRefIds: ["cyc-1", "cyc-2", "cyc-3", "cyc-4", "cyc-5", "cyc-6"],
          }),
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
  notes: null,
  schemas: [
    composeGroup({
      notes: ["parallel pyramids"],
      members: [
        buildComposeNode(
          {
            order: 1,
            rows: [mkRow(1, EX.powerSnatch, { load: absoluteLoad({ count: 1, kg: 50 }) })],
          },
          ladderRep([3, 5, 3]),
          null,
        ),
        buildComposeNode(
          {
            order: 2,
            rows: [mkRow(1, EX.powerSnatch, { load: absoluteLoad({ count: 1, kg: 50 }) })],
          },
          ladderRep([5, 7, 5]),
          null,
        ),
      ],
    }),
  ],
};
