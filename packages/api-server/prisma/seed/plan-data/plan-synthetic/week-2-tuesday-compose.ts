import {
  absoluteLoad,
  alternating,
  bodyweightLoad,
  buildComposeNode,
  composeGroup,
  countReps,
  dualWeight,
  ladderRep,
  restBetweenRounds,
  rounds,
  singleWeight,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_FIXED_MIN_3 = restBetweenRounds({ value: 3, unit: "min" }, "fixed");

export const BLOCK_ALTERNATING_SETS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-009",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    composeGroup({
      label: null,
      members: [
        buildComposeNode(
          {
            order: 1,
            header: "Alternating Sets A",
            rows: [
              mkRow(
                1,
                { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
                { load: absoluteLoad(singleWeight(75)), reps: countReps(5) },
              ),
            ],
          },
          {},
          null,
        ),
        buildComposeNode(
          {
            order: 2,
            header: "Alternating Sets B",
            rows: [
              mkRow(
                1,
                { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pendlayRow } },
                { load: absoluteLoad(singleWeight(70)), reps: countReps(5) },
              ),
            ],
          },
          {},
          null,
        ),
      ],
    }),
  ],
};

export const BLOCK_NESTED_ROUNDS_OVER_ROUNDS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-011",
  order: 2,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    composeGroup({
      label: "3 rounds:",
      members: [
        buildComposeNode(
          {
            order: 1,
            header: "inner 5 rounds",
            rows: [
              mkRow(
                1,
                { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.thruster } },
                { load: absoluteLoad(singleWeight(40)), reps: countReps(10) },
              ),
            ],
          },
          { ...rounds(5), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
          null,
        ),
      ],
    }),
  ],
};

export const BLOCK_NESTED_OVER_PARALLEL_LADDER_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-010",
  order: 3,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    composeGroup({
      label: "nested rounds over parallel ladder — 2 rounds",
      members: [
        buildComposeNode(
          {
            order: 1,
            rows: [
              mkRow(
                1,
                {
                  rowKind: "EXERCISE",
                  exercise: { form: "atomic", exerciseId: EX.dbSnatch },
                },
                {
                  load: absoluteLoad(dualWeight(22.5)),
                  side: alternating("[ alternative ]"),
                },
              ),
            ],
          },
          ladderRep([9, 6, 3]),
          null,
        ),
        buildComposeNode(
          {
            order: 2,
            rows: [
              mkRow(
                1,
                {
                  rowKind: "EXERCISE",
                  exercise: { form: "atomic", exerciseId: EX.boxJump },
                },
                { load: bodyweightLoad(), reps: countReps(10) },
              ),
            ],
          },
          ladderRep([3, 6, 9]),
          null,
        ),
      ],
    }),
  ],
};
