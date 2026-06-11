import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  cadenceRep,
  countReps,
  intervalRep,
  maxReps,
  rounds,
  singleWeight,
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
    buildComposeNode(
      {
        order: 1,
        header: "Power Set",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerClean } },
            { load: absoluteLoad(singleWeight(70)), reps: countReps(3) },
          ),
        ],
      },
      rounds(5),
      null,
    ),
  ],
};

const BLOCK_NAMED_EXERCISE_PROGRAM_WK1_FRI: CanonicalBlock = {
  blockInstanceRef: "block-181",
  order: 2,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Bench Press wave progression",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
            {
              load: absoluteLoad(singleWeight(70)),
              reps: maxReps("progressive-bench"),
            },
          ),
        ],
      },
      {},
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "trailing-then schema",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictPullUp } },
            { load: bodyweightLoad(), reps: countReps(5) },
          ),
        ],
      },
      {},
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.barDip } },
            { load: bodyweightLoad(), reps: countReps(10) },
          ),
        ],
      },
      {},
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictHspu } },
            { load: bodyweightLoad(), reps: countReps(30) },
          ),
        ],
      },
      {},
      null,
    ),
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
    buildComposeNode(
      {
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
      },
      {},
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "every 3 min × 5 rolling rounds",
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
      },
      cadenceRep(3, 5),
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "intervals + max box jumps tail",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
            {
              load: bodyweightLoad(),
              reps: maxReps("in remaining time"),
            },
          ),
        ],
      },
      { ...intervalRep(1, 1, 5) },
      null,
    ),
  ],
};

const SESSION_WK1_FRI: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
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
