import { bodyweightLoad, buildComposeNode, cadenceRep, countReps } from "../builder";
import type { CanonicalBlock, CanonicalRow } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const SLOT_EXERCISES: string[] = [
  EX.burpee,
  EX.boxJump,
  EX.pullUp,
  EX.pushUp,
  EX.airSquat,
  EX.sitUp,
  EX.kbSwing,
  EX.dbSnatch,
  EX.toesToBar,
  EX.doubleUnder,
  EX.walkingLunge,
  EX.vUp,
  EX.ringRow,
  EX.barDip,
  EX.pikePushUp,
  EX.jumpSquat,
  EX.kneesToElbows,
  EX.bandRow,
  EX.russianTwist,
  EX.shuttleRun,
  EX.dbThruster,
  EX.kbClean,
];

const EMOM_MINUTES = 22;
const SLOT_REPS = 10;

const buildSlotRow = (minute: number): CanonicalRow =>
  mkRow(minute, SLOT_EXERCISES[(minute - 1) % SLOT_EXERCISES.length] ?? EX.burpee, {
    load: bodyweightLoad(),
    reps: countReps(SLOT_REPS),
    notes: [`Min ${minute}`],
  });

const SLOT_ROWS: CanonicalRow[] = Array.from({ length: EMOM_MINUTES }, (_, i) =>
  buildSlotRow(i + 1),
);

export const BLOCK_EMOM_22_SUBSCHEMAS: CanonicalBlock = {
  blockInstanceRef: "block-180",
  order: 2,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "22-min EMOM (slots-as-rows coverage)",
        rows: SLOT_ROWS,
      },
      cadenceRep(1, EMOM_MINUTES),
      null,
    ),
  ],
};
