import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  eachArm,
  effortPercent,
  maxReps,
  mediaReference,
  rounds,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL, MOD } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_DROP_SET_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-008",
  order: 1,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Bulgarian Split Squat drop set (each leg)",
        intensity: effortPercent({ value: 80 }),
        rows: [
          mkRow(1, EX.dbBulgarianSplitSquat, {
            load: absoluteLoad({ count: 1, kg: 20 }),
            reps: countReps(8),
            side: eachArm(),
            modifierRefs: [MOD.fromSofa],
          }),
          mkRow(2, EX.jumpSquat, {
            load: bodyweightLoad(),
            reps: maxReps(),
            media: mediaReference({ url: "https://example.com/demo/explode-stage" }),
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_TEMPO_HOLDS_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-049",
  order: 5,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Tempo holds",
        rows: [
          mkRow(1, EX.benchPress, {
            load: absoluteLoad({ count: 1, kg: 60 }),
            reps: countReps(5),
            modifierRefs: [MOD.slowEccentric4s],
          }),
          mkRow(2, EX.backSquat, {
            load: absoluteLoad({ count: 1, kg: 80 }),
            reps: countReps(5),
            modifierRefs: [MOD.pauseInUp2s],
          }),
          mkRow(3, EX.frontSquat, {
            load: absoluteLoad({ count: 1, kg: 70 }),
            reps: countReps(5),
            modifierRefs: [MOD.holdAfterLast10s],
          }),
          mkRow(4, EX.pullUp, {
            load: bodyweightLoad(),
            reps: countReps(10),
            modifierRefs: [MOD.pauseEvery3Reps],
          }),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};
