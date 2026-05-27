import { absoluteLoad, countReps, nRounds, pace, singleWeight } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_PACE_MODERATE_WK2_FRI: CanonicalBlock = {
  blockInstanceRef: "block-111",
  order: 1,
  labels: [LBL.endurance],
  intensity: pace("moderate"),
  timeCap: null,
  notes: null,
  schemas: [
    nRounds({
      order: 1,
      countForm: "exact",
      count: 4,
      header: "Demo moderate pace strength endurance",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.bbWalkingLunge } },
          { load: absoluteLoad(singleWeight(40)), reps: countReps(20) },
        ),
      ],
    }),
  ],
};

const SESSION_WK2_FRI: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_PACE_MODERATE_WK2_FRI],
};

export const DAY_WK2_FRI: CanonicalDay = {
  dayOfWeek: "FRIDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_FRI],
};
