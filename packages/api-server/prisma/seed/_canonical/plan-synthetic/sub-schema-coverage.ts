import {
  bodyweightLoad,
  countReps,
  emomNestedPerMinute,
  emomSubMinuteSlot,
  singleSlot,
} from "../builder";
import type { CanonicalBlock, CanonicalSchemaNode } from "../canonical-schema";

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

const buildSlot = (minute: number): CanonicalSchemaNode =>
  emomSubMinuteSlot({
    order: minute,
    slot: singleSlot(minute),
    header: `Min ${minute}`,
    rows: [
      mkRow(
        1,
        {
          rowKind: "EXERCISE",
          exercise: {
            form: "atomic",
            exerciseId: SLOT_EXERCISES[(minute - 1) % SLOT_EXERCISES.length] ?? EX.burpee,
          },
        },
        { load: bodyweightLoad(), reps: countReps(SLOT_REPS) },
      ),
    ],
  });

const SUB_SLOTS: CanonicalSchemaNode[] = Array.from({ length: EMOM_MINUTES }, (_, i) =>
  buildSlot(i + 1),
);

export const BLOCK_EMOM_20_SUBSCHEMAS: CanonicalBlock = {
  blockInstanceRef: "block-180",
  order: 2,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    emomNestedPerMinute({
      order: 1,
      durationMin: EMOM_MINUTES,
      header: "Demo 20-min EMOM (sub-schema coverage)",
      rows: [],
      subSchemas: SUB_SLOTS,
    }),
  ],
};
