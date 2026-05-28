import {
  absoluteLoad,
  bodyweightLoad,
  compositeIntervalsOnOffMaxTail,
  compositeRollingRounds,
  countReps,
  flatListHeaderless,
  maxReps,
  namedExerciseProgram,
  namedThemedSets,
  singleLineBare,
  singleLineTotalCounter,
  singleLineWithThenConnector,
  singleWeight,
  totalFlagReps,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const BLOCK_NAMED_THEMED_SETS_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-153",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    namedThemedSets({
      order: 1,
      count: 5,
      theme: "Demo Power Set",
      header: "Demo Power Set",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerClean } },
          { load: absoluteLoad(singleWeight(70)), reps: countReps(3) },
        ),
      ],
    }),
  ],
};

const BLOCK_NAMED_EXERCISE_PROGRAM_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-008",
  order: 2,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    namedExerciseProgram({
      order: 1,
      exerciseId: EX.benchPress,
      program: {
        programKind: "wave",
        stages: [
          { reps: 5, load: absoluteLoad(singleWeight(70)) },
          { reps: 3, load: absoluteLoad(singleWeight(80)) },
          { reps: 1, load: absoluteLoad(singleWeight(90)) },
        ],
      },
      header: "Demo Bench Press wave progression",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
          {
            load: absoluteLoad(singleWeight(70)),
            reps: maxReps({ subForm: "progressive", progressiveSeed: "demo-progressive-bench" }),
          },
        ),
      ],
    }),
  ],
};

const BLOCK_SINGLE_LINE_WITH_THEN_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-046",
  order: 3,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    singleLineWithThenConnector({
      order: 1,
      header: "Demo trailing-then schema",
      notes: "connector: then:",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictPullUp } },
          { load: bodyweightLoad(), reps: countReps(5) },
        ),
      ],
    }),
  ],
};

const BLOCK_SINGLE_LINE_BARE_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-047",
  order: 4,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    singleLineBare({
      order: 1,
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.barDip } },
          { load: bodyweightLoad(), reps: countReps(10) },
        ),
      ],
    }),
  ],
};

const BLOCK_SINGLE_LINE_TOTAL_COUNTER_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-102",
  order: 5,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    singleLineTotalCounter({
      order: 1,
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictHspu } },
          { load: bodyweightLoad(), reps: totalFlagReps(30) },
        ),
      ],
    }),
  ],
};

const BLOCK_FLAT_LIST_HEADERLESS_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-145",
  order: 6,
  labels: [LBL.mobility],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    flatListHeaderless({
      order: 1,
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.bandPullApart } },
          { reps: countReps(20) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.plankHold } },
          { reps: unitBoundReps({ unit: "sec", value: 30 }) },
        ),
      ],
    }),
  ],
};

const BLOCK_COMPOSITE_ROLLING_ROUNDS_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-144",
  order: 7,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeRollingRounds({
      order: 1,
      everyNthMin: 3,
      rounds: 5,
      totalMin: 15,
      header: "Demo every 3 min × 5 rolling rounds",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbSnatch } },
          { load: absoluteLoad(singleWeight(22.5)), reps: countReps(10) },
        ),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
          { load: bodyweightLoad(), reps: countReps(10) },
        ),
      ],
    }),
  ],
};

const BLOCK_COMPOSITE_INT_ON_OFF_MAX_TAIL_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-143",
  order: 8,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    compositeIntervalsOnOffMaxTail({
      order: 1,
      intervals: 5,
      onMin: 1,
      offMin: 1,
      tailExerciseId: EX.boxJump,
      header: "Demo intervals + max box jumps tail",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
          {
            load: bodyweightLoad(),
            reps: maxReps({ subForm: "in_remaining_time", targetExerciseId: EX.boxJump }),
          },
        ),
      ],
    }),
  ],
};

const SESSION_WK1_FRI: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [
    BLOCK_NAMED_THEMED_SETS_WK1_FRI,
    BLOCK_NAMED_EXERCISE_PROGRAM_WK1_FRI,
    BLOCK_SINGLE_LINE_WITH_THEN_WK1_FRI,
    BLOCK_SINGLE_LINE_BARE_WK1_FRI,
    BLOCK_SINGLE_LINE_TOTAL_COUNTER_WK1_FRI,
    BLOCK_FLAT_LIST_HEADERLESS_WK1_FRI,
    BLOCK_COMPOSITE_ROLLING_ROUNDS_WK1_FRI,
    BLOCK_COMPOSITE_INT_ON_OFF_MAX_TAIL_WK1_FRI,
  ],
};

export const DAY_WK1_FRI: CanonicalDay = {
  dayOfWeek: "FRIDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_FRI],
};
