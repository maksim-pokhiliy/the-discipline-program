import {
  absoluteLoad,
  alternating,
  bodyweightLoad,
  buildComposeNode,
  composeGroup,
  countReps,
  ladderRep,
  restBetweenRounds,
  rounds,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_FIXED_MIN_3 = restBetweenRounds({ value: 3, unit: "min" }, "fixed");

export const BLOCK_ALTERNATING_SETS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-009",
  order: 1,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    composeGroup({
      notes: null,
      members: [
        buildComposeNode(
          {
            order: 1,
            header: "Alternating Sets A",
            rows: [
              mkRow(1, EX.benchPress, {
                load: absoluteLoad({ count: 1, kg: 75 }),
                reps: countReps(5),
              }),
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
              mkRow(1, EX.pendlayRow, {
                load: absoluteLoad({ count: 1, kg: 70 }),
                reps: countReps(5),
              }),
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
  notes: null,
  schemas: [
    composeGroup({
      notes: ["3 rounds:"],
      members: [
        buildComposeNode(
          {
            order: 1,
            header: "inner 5 rounds",
            rows: [
              mkRow(1, EX.thruster, {
                load: absoluteLoad({ count: 1, kg: 40 }),
                reps: countReps(10),
              }),
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
  notes: null,
  schemas: [
    composeGroup({
      notes: ["nested rounds over parallel ladder — 2 rounds"],
      members: [
        buildComposeNode(
          {
            order: 1,
            rows: [
              mkRow(1, EX.dbSnatch, {
                load: absoluteLoad({ count: 2, kg: 22.5 }),
                side: alternating("[ alternative ]"),
              }),
            ],
          },
          ladderRep([9, 6, 3]),
          null,
        ),
        buildComposeNode(
          {
            order: 2,
            rows: [mkRow(1, EX.boxJump, { load: bodyweightLoad(), reps: countReps(10) })],
          },
          ladderRep([3, 6, 9]),
          null,
        ),
      ],
    }),
  ],
};
