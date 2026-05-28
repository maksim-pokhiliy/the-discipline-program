import {
  absoluteLoad,
  bodyweightLoad,
  dualWeight,
  ladderAscending,
  ladderSpike,
  ladderVertexDownPyramid,
  mediaReference,
  parallelLaddersDescending,
  practiceList,
  rangeReps,
  singleWeight,
  unitBoundReps,
  urlOnlyBody,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const PRIMARY_PULL_UP_ROW_ID = "wk1sat-parallel-pullup";
const PRIMARY_PUSH_UP_ROW_ID = "wk1sat-parallel-pushup";

const BLOCK_PARALLEL_LADDERS_DESC_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-037",
  order: 1,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    parallelLaddersDescending({
      order: 1,
      header: "parallel ladders 36-28-20 / 18-14-10",
      ladders: [
        { steps: [36, 28, 20], direction: "desc" },
        { steps: [18, 14, 10], direction: "desc" },
      ],
      rows: [
        mkRow(1, { rowKind: "INNER_LADDER_MARKER", steps: [36, 28, 20] }),
        mkRow(
          2,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictPullUp } },
          { load: bodyweightLoad(), refId: PRIMARY_PULL_UP_ROW_ID },
        ),
        mkRow(3, { rowKind: "INNER_LADDER_MARKER", steps: [18, 14, 10] }),
        mkRow(
          4,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pushUp } },
          { load: bodyweightLoad(), refId: PRIMARY_PUSH_UP_ROW_ID },
        ),
      ],
    }),
  ],
};

const BLOCK_LADDER_ASCENDING_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-032",
  order: 2,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    ladderAscending({
      order: 1,
      steps: [5, 10, 15],
      header: "ascending 5-10-15",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbSnatch } },
          { load: absoluteLoad(dualWeight(22.5)), reps: rangeReps(5, 15) },
        ),
      ],
    }),
  ],
};

const BLOCK_LADDER_VERTEX_PYRAMID_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-098",
  order: 3,
  labels: [LBL.olympic],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    ladderVertexDownPyramid({
      order: 1,
      steps: [3, 6, 9, 6, 3],
      header: "vertex pyramid 3-6-9-6-3",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerClean } },
          { load: absoluteLoad(singleWeight(60)) },
        ),
      ],
    }),
  ],
};

const BLOCK_LADDER_SPIKE_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-106",
  order: 4,
  labels: [LBL.skill],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    ladderSpike({
      order: 1,
      steps: [10, 8, 6, 12],
      header: "ladder spike",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.kbSnatch } },
          { load: absoluteLoad(singleWeight(20)) },
        ),
      ],
    }),
  ],
};

const BLOCK_PRACTICE_LIST_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-146",
  order: 5,
  labels: [LBL.practice],
  intensity: null,
  timeCap: { min: 5, max: 10, unit: "min" },
  notes: null,
  schemas: [
    practiceList({
      order: 1,
      header: "Practice 5-10 min",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.hsWalk } },
          { reps: unitBoundReps({ unit: "min", range: { min: 5, max: 10 } }) },
        ),
      ],
    }),
  ],
};

const BLOCK_URL_ONLY_BODY_WRAPPED_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-147",
  order: 6,
  labels: [LBL.skill],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    urlOnlyBody({
      order: 1,
      header: "URL only body (wrapped)",
      rows: [
        mkRow(
          1,
          {
            rowKind: "STANDALONE_URL",
            url: "https://example.com/demo/wrapped-url",
            wrapped: true,
            appliesTo: "whole_schema",
          },
          {
            media: mediaReference({
              url: "https://example.com/demo/wrapped-url",
              position: "standalone_row",
              appliesTo: "whole_schema",
            }),
          },
        ),
      ],
    }),
  ],
};

const BLOCK_URL_ONLY_BODY_BARE_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-149",
  order: 7,
  labels: [LBL.skill],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    urlOnlyBody({
      order: 1,
      header: null,
      rows: [
        mkRow(
          1,
          {
            rowKind: "STANDALONE_URL",
            url: "https://example.com/demo/bare-url",
            wrapped: false,
            appliesTo: "previous_exercise_row",
          },
          {
            media: mediaReference({
              url: "https://example.com/demo/bare-url",
              position: "bare",
              appliesTo: "whole_schema",
            }),
          },
        ),
      ],
    }),
  ],
};

const BLOCK_STRENGTH_ENDURANCE_EMPTY_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-002",
  order: 8,
  labels: [LBL.strengthEndurance],
  intensity: null,
  timeCap: null,
  notes: "STRENGTH ENDURANCE — empty body block",
  schemas: [],
};

const BLOCK_MULTILABEL_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-048",
  order: 9,
  labels: [LBL.strengthEndurance, LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    ladderAscending({
      order: 1,
      steps: [3, 5, 7],
      header: "Strength Endurance + Gymnastics ladder",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictRingPullUp } },
          { load: bodyweightLoad(), reps: rangeReps(3, 7) },
        ),
      ],
    }),
  ],
};

const SESSION_WK1_SAT: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [
    BLOCK_PARALLEL_LADDERS_DESC_WK1_SAT,
    BLOCK_LADDER_ASCENDING_WK1_SAT,
    BLOCK_LADDER_VERTEX_PYRAMID_WK1_SAT,
    BLOCK_LADDER_SPIKE_WK1_SAT,
    BLOCK_PRACTICE_LIST_WK1_SAT,
    BLOCK_URL_ONLY_BODY_WRAPPED_WK1_SAT,
    BLOCK_URL_ONLY_BODY_BARE_WK1_SAT,
    BLOCK_STRENGTH_ENDURANCE_EMPTY_WK1_SAT,
    BLOCK_MULTILABEL_WK1_SAT,
  ],
};

export const DAY_WK1_SAT: CanonicalDay = {
  dayOfWeek: "SATURDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK1_SAT],
};
