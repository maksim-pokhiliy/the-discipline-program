import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  effortPercent,
  intervalRep,
  mediaReference,
  pace,
  restBetweenRounds,
  rounds,
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
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "4-5 rounds with rest",
        intensity: pace("hard"),
        rows: [
          mkRow(1, EX.thruster, { load: absoluteLoad({ count: 1, kg: 43 }), reps: countReps(15) }),
          mkRow(2, EX.pullUp, { load: bodyweightLoad(), reps: countReps(12) }),
        ],
      },
      { ...rounds({ min: 4, max: 5 }), rest: REST_BETWEEN_ROUNDS_RANGE_MIN },
      null,
    ),
  ],
};

const BLOCK_COMPOSITE_INT_THEN_ROUNDS_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-015",
  order: 2,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "intervals then rounds",
        rows: [mkRow(1, EX.run, { reps: unitBoundReps({ unit: "min", value: 1 }) })],
      },
      { repetition: { kind: "interval", workMin: 1, offMin: 1, count: 4 } },
      null,
    ),
    buildComposeNode(
      {
        order: 2,
        header: null,
        rows: [
          mkRow(1, EX.kbSwing, { load: absoluteLoad({ count: 1, kg: 24 }), reps: countReps(15) }),
          mkRow(2, EX.boxJump, {
            load: bodyweightLoad(),
            reps: countReps(10),
            media: mediaReference({ url: "https://example.com/demo/box-jump" }),
          }),
          mkRow(3, EX.burpee, {
            load: bodyweightLoad(),
            reps: countReps(10),
            media: mediaReference({ url: "https://example.com/demo/burpee-follow" }),
          }),
        ],
      },
      { repetition: { kind: "count", count: 3 } },
      null,
    ),
  ],
};

const BLOCK_COMPOSITE_INT_WR_FIXED_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-142",
  order: 3,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "6 intervals 2 work / 1 rest",
        rows: [
          mkRow(1, EX.rowCal, { reps: unitBoundReps({ unit: "min", range: { min: 1, max: 2 } }) }),
        ],
      },
      {
        repetition: { kind: "interval", workMin: 2, offMin: 1, count: 6 },
      },
      null,
    ),
  ],
};

const BLOCK_COMPOSITE_INT_WR_PROG_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-140",
  order: 4,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "progressive intervals",
        rows: [mkRow(1, EX.skiCal, { reps: countReps(60) })],
      },
      {
        ...intervalRep(2, 2, 4),
      },
      null,
    ),
  ],
};

const BLOCK_AMRAP_FLAT_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-078",
  order: 5,
  labels: [LBL.metcon],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "AMRAP 12 at 75-80% effort",
        intensity: effortPercent({ range: { min: 75, max: 80 } }),
        rows: [
          mkRow(1, EX.dbThruster, {
            load: absoluteLoad({ count: 1, kg: 10 }),
            reps: countReps(15),
          }),
          mkRow(2, EX.boxJump, { load: bodyweightLoad(), reps: countReps(12) }),
        ],
      },
      {
        repetition: { kind: "timeCap", cap: { min: 12, unit: "min" } },
      },
      null,
    ),
  ],
};

const BLOCK_RUN_DISTANCE_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-060",
  order: 6,
  labels: [LBL.endurance, LBL.easyPace],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Run 5-7 km easy pace",
        intensity: pace("easy"),
        rows: [
          mkRow(1, EX.run, { reps: unitBoundReps({ unit: "km", range: { min: 5, max: 7 } }) }),
          mkRow(2, EX.run, { reps: unitBoundReps({ unit: "min", value: 60 }) }),
        ],
      },
      {},
      null,
    ),
  ],
};

const BLOCK_REST_BETWEEN_ROUNDS_SEC_WK1_WED: CanonicalBlock = {
  blockInstanceRef: "block-018",
  order: 7,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "3 rounds rest 60-90 sec",
        rows: [
          mkRow(1, EX.dbSnatch, {
            load: absoluteLoad({ count: 1, kg: 22.5 }),
            reps: countReps(10),
          }),
        ],
      },
      { ...rounds(3), rest: REST_BETWEEN_ROUNDS_RANGE_SEC },
      null,
    ),
  ],
};

const SESSION_WK1_WED: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
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
