import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  dualWeight,
  eachLeg,
  implicitReps,
  restBetweenSets,
  singleWeight,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_SETS_FIXED_MIN = restBetweenSets({ value: 2, unit: "min" }, "fixed");

const BLOCK_STRENGTH_NROUNDS_WK1_MON: CanonicalBlock = {
  blockInstanceRef: "block-001",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: "Week 1 MON strength block",
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "5 rounds for strength",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.backSquat } },
            { load: absoluteLoad(singleWeight(80)), reps: countReps(5) },
          ),
          mkRow(
            2,
            {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: EX.dbBulgarianSplitSquat },
            },
            { load: absoluteLoad(dualWeight(20)), reps: countReps(8), side: eachLeg(8) },
          ),
          mkRow(3, {
            rowKind: "REST",
            raw: "Rest 2 min between sets",
            parsed: REST_BETWEEN_SETS_FIXED_MIN,
          }),
          mkRow(4, {
            rowKind: "STANDALONE_LOAD",
            load: absoluteLoad(dualWeight(20)),
            scope: "applies_to_all_preceding_rows",
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
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "15-12-9 ladder",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.airSquat } },
            { load: bodyweightLoad(), reps: implicitReps() },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pushUp } },
            { load: bodyweightLoad(), reps: implicitReps() },
          ),
        ],
      },
      {
        repetition: { kind: "ladder", steps: [15, 12, 9] },
        arrangement: { kind: "ordered" },
      },
      null,
    ),
  ],
};

const SESSION_WK1_MON: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_STRENGTH_NROUNDS_WK1_MON, BLOCK_LADDER_DESC_WK1_MON],
};

export const DAY_WK1_MON: CanonicalDay = {
  dayOfWeek: "MONDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_MON],
};
