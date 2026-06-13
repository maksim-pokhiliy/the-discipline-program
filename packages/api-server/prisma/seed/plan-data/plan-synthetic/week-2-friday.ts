import { absoluteLoad, buildComposeNode, countReps, pace, rounds } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";
import { BLOCK_EMOM_22_SUBSCHEMAS } from "./sub-schema-coverage";

const BLOCK_PACE_MODERATE_WK2_FRI: CanonicalBlock = {
  blockInstanceRef: "block-111",
  order: 1,
  labels: [LBL.endurance],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "moderate pace strength endurance",
        intensity: pace("moderate"),
        rows: [
          mkRow(1, EX.bbWalkingLunge, {
            load: absoluteLoad({ count: 1, kg: 40 }),
            reps: countReps(20),
          }),
        ],
      },
      rounds(4),
      null,
    ),
  ],
};

const SESSION_WK2_FRI: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  blocks: [BLOCK_PACE_MODERATE_WK2_FRI, BLOCK_EMOM_22_SUBSCHEMAS],
};

export const DAY_WK2_FRI: CanonicalDay = {
  dayOfWeek: "FRIDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_FRI],
};
