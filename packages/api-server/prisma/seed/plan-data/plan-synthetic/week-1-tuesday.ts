import { bodyweightLoad, buildComposeNode, countReps, maxReps } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_EMOM_NESTED_WK1_TUE: CanonicalBlock = {
  blockInstanceRef: "block-080",
  order: 1,
  labels: [LBL.metcon],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "EMOM 12 min, 3 rounds of 4 slots",
        rows: [],
        subSchemas: [
          buildComposeNode(
            {
              order: 1,
              header: "1 min",
              rows: [
                mkRow(
                  1,
                  { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.burpee } },
                  { load: bodyweightLoad(), reps: maxReps({ subForm: "bare" }) },
                ),
              ],
            },
            {},
            null,
          ),
          buildComposeNode(
            {
              order: 2,
              header: "2nd & 3rd min",
              rows: [
                mkRow(
                  1,
                  { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pullUp } },
                  { load: bodyweightLoad(), reps: countReps(10) },
                ),
              ],
            },
            {},
            null,
          ),
          buildComposeNode(
            {
              order: 3,
              header: "4 min",
              rows: [mkRow(1, { rowKind: "REST_SLOT" })],
            },
            {},
            null,
          ),
        ],
      },
      {
        repetition: { kind: "cadence", everyMin: 1, rounds: 3 },
      },
      null,
    ),
  ],
};

const SESSION_WK1_TUE: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_EMOM_NESTED_WK1_TUE],
};

export const DAY_WK1_TUE: CanonicalDay = {
  dayOfWeek: "TUESDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_TUE],
};
