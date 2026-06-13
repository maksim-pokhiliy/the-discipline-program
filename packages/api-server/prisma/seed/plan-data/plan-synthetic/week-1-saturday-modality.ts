import { bodyweightLoad, buildComposeNode, ladderRep, mediaReference, rangeReps } from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_PRACTICE_LIST_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-146",
  order: 5,
  labels: [LBL.practice],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Practice 5-10 min",
        rows: [mkRow(1, EX.hsWalk, {})],
      },
      { repetition: { kind: "timeCap", cap: { min: 5, max: 10, unit: "min" } } },
      null,
    ),
  ],
};

export const BLOCK_URL_ONLY_BODY_WRAPPED_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-147",
  order: 6,
  labels: [LBL.skill],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Yoga time",
        rows: [
          mkRow(1, EX.placeholderCoachChoice, {
            media: mediaReference({ url: "https://example.com/demo/yoga-flow" }),
            notes: ["Follow the yoga video"],
          }),
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
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: null,
        rows: [
          mkRow(1, EX.placeholderWarmUp, {
            media: mediaReference({ url: "https://example.com/demo/warm-up-feet" }),
            notes: ["Warm up for feet — follow the video"],
          }),
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
  notes: ["STRENGTH ENDURANCE — empty body block"],
  schemas: [],
};

export const BLOCK_MULTILABEL_WK1_SAT: CanonicalBlock = {
  blockInstanceRef: "block-048",
  order: 9,
  labels: [LBL.strengthEndurance, LBL.gymnastics],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Strength Endurance + Gymnastics ladder",
        rows: [mkRow(1, EX.strictRingPullUp, { load: bodyweightLoad(), reps: rangeReps(3, 7) })],
      },
      ladderRep([3, 5, 7]),
      null,
    ),
  ],
};
