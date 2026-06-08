import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  cuidFromSeed,
  dualWeight,
  ladderRep,
  rangeReps,
  singleWeight,
} from "../builder";
import type { CanonicalBlock, CanonicalDay, CanonicalSession } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";
import {
  BLOCK_MULTILABEL_WK1_SAT,
  BLOCK_PRACTICE_LIST_WK1_SAT,
  BLOCK_STRENGTH_ENDURANCE_EMPTY_WK1_SAT,
  BLOCK_URL_ONLY_BODY_BARE_WK1_SAT,
  BLOCK_URL_ONLY_BODY_WRAPPED_WK1_SAT,
} from "./week-1-saturday-modality";

const TRACK_A = cuidFromSeed("schema::block-037::track-a");
const TRACK_B = cuidFromSeed("schema::block-037::track-b");

const BLOCK_PARALLEL_LADDERS_DESC_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-037",
  order: 1,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "parallel ladders 36-28-20 / 18-14-10",
        subSchemas: [
          buildComposeNode(
            {
              order: 1,
              refId: TRACK_A,
              rows: [
                mkRow(
                  1,
                  {
                    rowKind: "EXERCISE",
                    exercise: { form: "atomic", exerciseId: EX.strictPullUp },
                  },
                  { load: bodyweightLoad() },
                ),
              ],
            },
            ladderRep([36, 28, 20]),
            null,
          ),
          buildComposeNode(
            {
              order: 2,
              refId: TRACK_B,
              rows: [
                mkRow(
                  1,
                  { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pushUp } },
                  { load: bodyweightLoad() },
                ),
              ],
            },
            ladderRep([18, 14, 10]),
            null,
          ),
        ],
      },
      {
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: TRACK_A }, { childSchemaId: TRACK_B }],
        },
      },
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "ascending 5-10-15",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbSnatch } },
            { load: absoluteLoad(dualWeight(22.5)), reps: rangeReps(5, 15) },
          ),
        ],
      },
      { ...ladderRep([5, 10, 15]), arrangement: { kind: "ordered" } },
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "vertex pyramid 3-6-9-6-3",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerClean } },
            { load: absoluteLoad(singleWeight(60)) },
          ),
        ],
      },
      { ...ladderRep([3, 6, 9, 6, 3]), arrangement: { kind: "ordered" } },
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "ladder spike",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.kbSnatch } },
            { load: absoluteLoad(singleWeight(20)) },
          ),
        ],
      },
      { ...ladderRep([10, 8, 6, 12]), arrangement: { kind: "ordered" } },
      null,
    ),
  ],
};

const SESSION_WK1_SAT: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
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
