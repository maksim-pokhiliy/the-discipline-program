import {
  absoluteLoad,
  alternating,
  bodyweightLoad,
  buildComposeNode,
  compoundRepUnitReps,
  countReps,
  cuidFromSeed,
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

const ALT_SET_A = cuidFromSeed("schema::block-009::set-a");
const ALT_SET_B = cuidFromSeed("schema::block-009::set-b");

const MIXED_LADDER_TRACK_A = cuidFromSeed("schema::block-010::track-a");
const MIXED_LADDER_TRACK_B = cuidFromSeed("schema::block-010::track-b");

export const BLOCK_ALTERNATING_SETS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-009",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        subSchemas: [
          buildComposeNode(
            {
              order: 1,
              refId: ALT_SET_A,
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
              refId: ALT_SET_B,
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
      },
      {
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [
            { childSchemaId: ALT_SET_A, setEnumeration: [1, 2, 3, 4, 5] },
            { childSchemaId: ALT_SET_B, setEnumeration: [1, 2, 3, 4, 5] },
          ],
        },
      },
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "3 outer rounds × inner",
        subSchemas: [
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
      },
      rounds(3),
      null,
    ),
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
    buildComposeNode(
      {
        order: 1,
        header: "nested rounds over parallel ladder",
        subSchemas: [
          buildComposeNode(
            {
              order: 1,
              subSchemas: [
                buildComposeNode(
                  {
                    order: 1,
                    refId: MIXED_LADDER_TRACK_A,
                    rows: [
                      mkRow(
                        1,
                        {
                          rowKind: "EXERCISE",
                          exercise: { form: "atomic", exerciseId: EX.dbSnatch },
                        },
                        {
                          load: absoluteLoad(dualWeight(22.5)),
                          reps: compoundRepUnitReps(),
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
                    refId: MIXED_LADDER_TRACK_B,
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
            },
            {
              arrangement: {
                kind: "parallel",
                interleaveOrder: "round_by_round",
                tracks: [
                  { childSchemaId: MIXED_LADDER_TRACK_A },
                  { childSchemaId: MIXED_LADDER_TRACK_B },
                ],
              },
            },
            null,
          ),
        ],
      },
      rounds(2),
      null,
    ),
  ],
};

export const BLOCK_NESTED_COMPOSITE_OVER_LADDER_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-020",
  order: 4,
  labels: [LBL.metcon],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "nested composite rounds over ladder",
      },
      { ...rounds(2), rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3 },
      null,
    ),
  ],
};
