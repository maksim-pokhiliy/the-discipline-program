import { bodyweightLoad, buildComposeNode, countReps, maxReps } from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_EMOM_NESTED_WK1_TUE: CanonicalBlock = {
  blockInstanceRef: "block-080",
  order: 1,
  labels: [LBL.metcon],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "EMOM 12 min, 3 rounds of 4 slots",
        rows: [
          mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: maxReps(), notes: ["1 min"] }),
          mkRow(2, EX.pullUp, {
            load: bodyweightLoad(),
            reps: countReps(10),
            notes: ["2nd & 3rd min"],
          }),
          mkRow(3, EX.restSlot, { notes: ["4 min"] }),
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
  blocks: [BLOCK_EMOM_NESTED_WK1_TUE],
};

export const DAY_WK1_TUE: CanonicalDay = {
  dayOfWeek: "TUESDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_TUE],
};
