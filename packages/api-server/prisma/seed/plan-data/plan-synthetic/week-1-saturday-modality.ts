import {
  bodyweightLoad,
  buildComposeNode,
  ladderRep,
  mediaReference,
  rangeReps,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_PRACTICE_LIST_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-146",
  order: 5,
  labels: [LBL.practice],
  intensity: null,
  timeCap: { min: 5, max: 10, unit: "min" },
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Practice 5-10 min",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.hsWalk } },
            { reps: unitBoundReps({ unit: "min", range: { min: 5, max: 10 } }) },
          ),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_URL_ONLY_BODY_WRAPPED_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-147",
  order: 6,
  labels: [LBL.skill],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
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
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_URL_ONLY_BODY_BARE_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-149",
  order: 7,
  labels: [LBL.skill],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
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
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_STRENGTH_ENDURANCE_EMPTY_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-002",
  order: 8,
  labels: [LBL.strengthEndurance],
  intensity: null,
  timeCap: null,
  notes: "STRENGTH ENDURANCE — empty body block",
  schemas: [],
};

export const BLOCK_MULTILABEL_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-048",
  order: 9,
  labels: [LBL.strengthEndurance, LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Strength Endurance + Gymnastics ladder",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.strictRingPullUp } },
            { load: bodyweightLoad(), reps: rangeReps(3, 7) },
          ),
        ],
      },
      { ...ladderRep([3, 5, 7]), arrangement: { kind: "ordered" } },
      null,
    ),
  ],
};
