import {
  bodyweightLoad,
  buildComposeNode,
  countReps,
  pace,
  rounds,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_PACE_RECOVERY_WK2_SAT: CanonicalBlock = {
  blockInstanceRef: "block-112",
  order: 1,
  labels: [LBL.endurance],
  intensity: pace("recovery"),
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "recovery 3 km",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.run } },
            { reps: unitBoundReps({ unit: "km", value: 3 }) },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

const BLOCK_NOTES_EXAMPLE_WK2_SAT: CanonicalBlock = {
  blockInstanceRef: "block-141",
  order: 2,
  labels: [LBL.mobility],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "mobility flow",
        notes: "EXAMPLE: hip mobility flow, then thoracic openers; coach adapts to athlete",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.airSquat } },
            { load: bodyweightLoad(), reps: countReps(10) },
          ),
        ],
      },
      rounds(2),
      null,
    ),
  ],
};

const SESSION_WK2_SAT: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_PACE_RECOVERY_WK2_SAT, BLOCK_NOTES_EXAMPLE_WK2_SAT],
};

export const DAY_WK2_SAT: CanonicalDay = {
  dayOfWeek: "SATURDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_SAT],
};
