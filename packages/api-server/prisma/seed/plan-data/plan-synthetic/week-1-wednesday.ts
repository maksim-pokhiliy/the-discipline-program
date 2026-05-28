import {
  absoluteLoad,
  amrapFlat,
  bodyweightLoad,
  compositeIntervalsThenRounds,
  compositeIntervalsWorkRestFixed,
  compositeIntervalsWorkRestProgressive,
  compositeRoundsWithRest,
  countReps,
  effortPercent,
  mediaReference,
  pace,
  restBetweenRounds,
  runDistance,
  singleWeight,
  totalFlagReps,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_RANGE_MIN = restBetweenRounds(
  { value: 2, rangeMax: 3, unit: "range_min" },
  "range",
);
const REST_BETWEEN_ROUNDS_RANGE_SEC = restBetweenRounds(
  { value: 60, rangeMax: 90, unit: "range_sec" },
  "range",
);

const BLOCK_COMPOSITE_ROUNDS_REST_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-017",
  order: 1,
  labels: [LBL.metcon],
  intensity: pace("hard"),
  timeCap: null,
  notes: null,
  schemas: [
    compositeRoundsWithRest({
      order: 1,
      count: { min: 4, max: 5 },
      rest: REST_BETWEEN_ROUNDS_RANGE_MIN,
      header: "4-5 rounds with rest",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.thruster } },
          { load: absoluteLoad(singleWeight(43)), reps: countReps(15) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pullUp } },
          { load: bodyweightLoad(), reps: countReps(12) },
        ),
      ],
    }),
  ],
};

const BLOCK_COMPOSITE_INT_THEN_ROUNDS_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-015",
  order: 2,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeIntervalsThenRounds({
      order: 1,
      intervalsCount: 4,
      restMin: 1,
      innerRounds: 3,
      preambleExercise: { form: "atomic", exerciseId: EX.run },
      preambleReps: unitBoundReps({ unit: "min", value: 1 }),
      header: "intervals then rounds",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.kbSwing } },
          { load: absoluteLoad(singleWeight(24)), reps: countReps(15) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
          {
            load: bodyweightLoad(),
            reps: countReps(10),
            media: mediaReference({
              url: "https://example.com/demo/box-jump",
              position: "inline",
              appliesTo: "current_row",
            }),
          },
        ),
        mkRow(
          3,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.burpee } },
          {
            load: bodyweightLoad(),
            reps: countReps(10),
            media: mediaReference({
              url: "https://example.com/demo/burpee-follow",
              position: "inline",
              appliesTo: "previous_row",
            }),
          },
        ),
      ],
    }),
  ],
};

const BLOCK_COMPOSITE_INT_WR_FIXED_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-142",
  order: 3,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeIntervalsWorkRestFixed({
      order: 1,
      intervalsCount: 6,
      workMin: 2,
      restMin: 1,
      header: "6 intervals 2 work / 1 rest",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.rowCal } },
          { reps: unitBoundReps({ unit: "min", range: { min: 1, max: 2 } }) },
        ),
      ],
    }),
  ],
};

const BLOCK_COMPOSITE_INT_WR_PROG_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-140",
  order: 4,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeIntervalsWorkRestProgressive({
      order: 1,
      sets: 4,
      workMin: 2,
      offMin: 2,
      progressiveSeed: "progressive-2:00-3:00-4:00-5:00",
      header: "progressive intervals",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.skiCal } },
          { reps: totalFlagReps(60) },
        ),
      ],
    }),
  ],
};

const BLOCK_AMRAP_FLAT_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-078",
  order: 5,
  labels: [LBL.metcon],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    amrapFlat({
      order: 1,
      durationMin: 12,
      header: "AMRAP 12 at 75-80% effort",
      intensity: effortPercent({ range: { min: 75, max: 80 } }),
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbThruster } },
          { load: absoluteLoad(singleWeight(10)), reps: countReps(15) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
          { load: bodyweightLoad(), reps: countReps(12) },
        ),
      ],
    }),
  ],
};

const BLOCK_RUN_DISTANCE_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-060",
  order: 6,
  labels: [LBL.endurance, LBL.easyPace],
  intensity: pace("easy"),
  timeCap: null,
  notes: null,
  schemas: [
    runDistance({
      order: 1,
      distance: { range: { min: 5, max: 7 } },
      header: "Run 5-7 km easy pace",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.run } },
          { reps: unitBoundReps({ unit: "km", range: { min: 5, max: 7 } }) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.run } },
          { reps: unitBoundReps({ unit: "min", value: 60 }) },
        ),
      ],
    }),
  ],
};

const BLOCK_REST_BETWEEN_ROUNDS_SEC_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-018",
  order: 7,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeRoundsWithRest({
      order: 1,
      count: 3,
      rest: REST_BETWEEN_ROUNDS_RANGE_SEC,
      header: "3 rounds rest 60-90 sec",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbSnatch } },
          { load: absoluteLoad(singleWeight(22.5)), reps: countReps(10) },
        ),
      ],
    }),
  ],
};

const SESSION_WK1_WED: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [
    BLOCK_COMPOSITE_ROUNDS_REST_WK1_WED,
    BLOCK_COMPOSITE_INT_THEN_ROUNDS_WK1_WED,
    BLOCK_COMPOSITE_INT_WR_FIXED_WK1_WED,
    BLOCK_COMPOSITE_INT_WR_PROG_WK1_WED,
    BLOCK_AMRAP_FLAT_WK1_WED,
    BLOCK_RUN_DISTANCE_WK1_WED,
    BLOCK_REST_BETWEEN_ROUNDS_SEC_WK1_WED,
  ],
};

export const DAY_WK1_WED: CanonicalDay = {
  dayOfWeek: "WEDNESDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_WED],
};
