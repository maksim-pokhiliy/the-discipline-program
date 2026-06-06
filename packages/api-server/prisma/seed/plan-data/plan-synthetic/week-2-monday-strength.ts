import {
  absoluteLoad,
  bodyweightLoad,
  buildComposeNode,
  countReps,
  effortPercent,
  holdAfterLast,
  maxReps,
  mediaReference,
  pauseInUp,
  perNthRepPause,
  rounds,
  singleArmWeight,
  singleWeight,
  slowEccentric,
  withoutWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_DROP_SET_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-008",
  order: 1,
  labels: [LBL.strength],
  intensity: effortPercent({ value: 80 }),
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Bulgarian Split Squat drop set (each leg)",
        rows: [
          mkRow(
            1,
            {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: EX.dbBulgarianSplitSquat },
            },
            { load: absoluteLoad(singleArmWeight(20)), reps: countReps(8), position: "FROM_SOFA" },
          ),
          mkRow(
            2,
            {
              rowKind: "EXERCISE",
              exercise: { form: "atomic", exerciseId: EX.jumpSquat },
            },
            {
              load: withoutWeight(),
              reps: maxReps({ subForm: "bare" }),
              media: mediaReference({
                url: "https://example.com/demo/explode-stage",
                position: "inline",
                appliesTo: "drop_stage",
              }),
            },
          ),
        ],
      },
      { programKind: "drop_set" },
      null,
    ),
  ],
};

export const BLOCK_TEMPO_HOLDS_WK2_MON: CanonicalBlock = {
  blockInstanceRef: "block-049",
  order: 5,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Tempo holds",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
            { load: absoluteLoad(singleWeight(60)), reps: countReps(5), tempo: slowEccentric(4) },
          ),
          mkRow(
            2,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.backSquat } },
            { load: absoluteLoad(singleWeight(80)), reps: countReps(5), tempo: pauseInUp(2) },
          ),
          mkRow(
            3,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.frontSquat } },
            { load: absoluteLoad(singleWeight(70)), reps: countReps(5), tempo: holdAfterLast(10) },
          ),
          mkRow(
            4,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pullUp } },
            { load: bodyweightLoad(), reps: countReps(10), tempo: perNthRepPause(3, 2) },
          ),
        ],
      },
      rounds(3),
      null,
    ),
  ],
};
