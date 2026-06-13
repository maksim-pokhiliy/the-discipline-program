import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  pace,
  restAfterSpecificSet,
  restBetweenRounds,
  rounds,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { BLOCK_REST_COVERAGE } from "./rest-coverage";
import { mkRow } from "./row-helpers";

const REST_AFTER_SPECIFIC_SET_MIN = restAfterSpecificSet(3, { value: 2, unit: "min" }, "fixed");

const BLOCK_REST_AFTER_SPECIFIC_SET_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-100",
  order: 1,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "strength with rest after set 3",
        rows: [
          mkRow(1, EX.benchPress, { load: absoluteLoad({ count: 1, kg: 70 }), reps: countReps(5) }),
        ],
      },
      { ...rounds(5), rest: REST_AFTER_SPECIFIC_SET_MIN },
      null,
    ),
  ],
};

const BLOCK_PACE_HARD_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-101",
  order: 2,
  labels: [LBL.metcon],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "hard pace 3 rounds",
        intensity: pace("hard"),
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(20) })],
      },
      { ...rounds(3), rest: restBetweenRounds({ value: 2, unit: "min" }, "fixed") },
      null,
    ),
  ],
};

const BLOCK_UNSPECIFIED_LOAD_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-110",
  order: 3,
  labels: [LBL.accessory],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "unspecified load placeholder",
        rows: [mkRow(1, EX.dbLateralRaise, { reps: countReps(12) })],
      },
      rounds(3),
      null,
    ),
  ],
};

const SESSION_WK2_WED: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  blocks: [
    BLOCK_REST_AFTER_SPECIFIC_SET_WK2_WED,
    BLOCK_PACE_HARD_WK2_WED,
    BLOCK_UNSPECIFIED_LOAD_WK2_WED,
    BLOCK_REST_COVERAGE,
  ],
};

export const DAY_WK2_WED: CanonicalDay = {
  dayOfWeek: "WEDNESDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_WED],
};
