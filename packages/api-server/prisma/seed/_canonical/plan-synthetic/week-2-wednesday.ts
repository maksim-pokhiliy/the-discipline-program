import {
  absoluteLoad,
  bodyweightLoad,
  compositeRoundsWithRest,
  countReps,
  nRounds,
  pace,
  restAfterSpecificSet,
  singleWeight,
  unspecifiedLoad,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_AFTER_SPECIFIC_SET_MIN = restAfterSpecificSet(3, { value: 2, unit: "min" }, "fixed");

const BLOCK_REST_AFTER_SPECIFIC_SET_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-100",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    nRounds({
      order: 1,
      countForm: "exact",
      count: 5,
      header: "Demo strength with rest after set 3",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
          { load: absoluteLoad(singleWeight(70)), reps: countReps(5) },
        ),
        mkRow(2, {
          rowKind: "REST",
          raw: "Rest 2 min after set 3",
          parsed: REST_AFTER_SPECIFIC_SET_MIN,
        }),
      ],
    }),
  ],
};

const BLOCK_PACE_HARD_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-101",
  order: 2,
  labels: [LBL.metcon],
  intensity: pace("hard"),
  timeCap: null,
  notes: null,
  schemas: [
    compositeRoundsWithRest({
      order: 1,
      count: 3,
      rest: { duration: { value: 2, unit: "min" }, scope: "between_rounds", qualifier: "fixed" },
      header: "Demo hard pace 3 rounds",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.burpee } },
          { load: bodyweightLoad(), reps: countReps(20) },
        ),
      ],
    }),
  ],
};

const BLOCK_UNSPECIFIED_LOAD_WK2_WED: CanonicalBlock = {
  blockInstanceRef: "block-110",
  order: 3,
  labels: [LBL.accessory],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    nRounds({
      order: 1,
      countForm: "exact",
      count: 3,
      header: "Demo unspecified load placeholder",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbLateralRaise } },
          { load: unspecifiedLoad(), reps: countReps(12) },
        ),
      ],
    }),
  ],
};

const SESSION_WK2_WED: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [
    BLOCK_REST_AFTER_SPECIFIC_SET_WK2_WED,
    BLOCK_PACE_HARD_WK2_WED,
    BLOCK_UNSPECIFIED_LOAD_WK2_WED,
  ],
};

export const DAY_WK2_WED: CanonicalDay = {
  dayOfWeek: "WEDNESDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_WED],
};
