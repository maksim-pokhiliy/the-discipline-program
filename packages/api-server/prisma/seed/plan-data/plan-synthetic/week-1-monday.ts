import { absoluteLoad, bodyweightLoad, buildComposeNode, countReps, eachLeg } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_STRENGTH_NROUNDS_WK1_MON: CanonicalBlock = {
  blockInstanceRef: "block-001",
  order: 1,
  labels: [LBL.strength],
  notes: ["Week 1 MON strength block"],
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "5 rounds for strength",
        notes: ["Rest 2 min between sets"],
        rows: [
          mkRow(1, EX.backSquat, { load: absoluteLoad({ count: 1, kg: 80 }), reps: countReps(5) }),
          mkRow(2, EX.dbBulgarianSplitSquat, {
            load: absoluteLoad({ count: 2, kg: 20 }),
            reps: countReps(8),
            side: eachLeg(8),
          }),
        ],
      },
      {
        repetition: { kind: "count", count: 5 },
        rest: {
          duration: { value: 1, unit: "sec" },
          scope: "between_rounds",
          qualifier: "until_recovery",
        },
      },
      null,
    ),
  ],
};

const BLOCK_LADDER_DESC_WK1_MON: CanonicalBlock = {
  blockInstanceRef: "block-006",
  order: 2,
  labels: [LBL.warmUpFeet, LBL.warmUpRun],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "15-12-9 ladder",
        rows: [
          mkRow(1, EX.airSquat, { load: bodyweightLoad() }),
          mkRow(2, EX.pushUp, { load: bodyweightLoad() }),
        ],
      },
      {
        repetition: { kind: "ladder", steps: [15, 12, 9] },
      },
      null,
    ),
  ],
};

const SESSION_WK1_MON: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  blocks: [BLOCK_STRENGTH_NROUNDS_WK1_MON, BLOCK_LADDER_DESC_WK1_MON],
};

export const DAY_WK1_MON: CanonicalDay = {
  dayOfWeek: "MONDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_MON],
};
