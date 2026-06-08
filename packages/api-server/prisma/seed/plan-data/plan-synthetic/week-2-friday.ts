import { absoluteLoad, buildComposeNode, countReps, pace, rounds, singleWeight } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";
import { BLOCK_EMOM_22_SUBSCHEMAS } from "./sub-schema-coverage";

const BLOCK_PACE_MODERATE_WK2_FRI: CanonicalBlock = {
  blockInstanceRef: "block-111",
  order: 1,
  labels: [LBL.endurance],
  intensity: pace("moderate"),
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "moderate pace strength endurance",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.bbWalkingLunge } },
            { load: absoluteLoad(singleWeight(40)), reps: countReps(20) },
          ),
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
