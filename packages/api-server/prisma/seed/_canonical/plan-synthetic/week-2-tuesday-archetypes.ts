import {
  absoluteLoad,
  alternating,
  alternatingGroupRef,
  alternatingSets,
  bodyweightLoad,
  compositeRoundsWithRest,
  compoundRepUnitReps,
  countReps,
  dualWeight,
  nestedCompositeRoundsOverLadder,
  nestedRoundsOverParallelLadder,
  nestedRoundsOverRounds,
  parallelLaddersMixedDirection,
  parallelPyramids,
  pullUpsDipsCycle,
  restBetweenRounds,
  singleWeight,
  timeWindowOuter,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BETWEEN_ROUNDS_FIXED_MIN_3 = restBetweenRounds({ value: 3, unit: "min" }, "fixed");

const ALT_GROUP_REF_WK2_TUE = alternatingGroupRef("block-009", "set-a");

export const BLOCK_ALTERNATING_SETS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-009",
  order: 1,
  labels: [LBL.strength],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    alternatingSets({
      order: 1,
      setEnumeration: [1, 2, 3, 4, 5],
      header: "Demo Alternating Sets A",
      alternatingGroupRef: ALT_GROUP_REF_WK2_TUE,
      alternatingGroupRelation: "ALTERNATING_SETS",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.benchPress } },
          { load: absoluteLoad(singleWeight(75)), reps: countReps(5) },
        ),
      ],
    }),
    alternatingSets({
      order: 2,
      setEnumeration: [1, 2, 3, 4, 5],
      header: "Demo Alternating Sets B",
      alternatingGroupRef: ALT_GROUP_REF_WK2_TUE,
      alternatingGroupRelation: "ALTERNATING_SETS",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.pendlayRow } },
          { load: absoluteLoad(singleWeight(70)), reps: countReps(5) },
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
    nestedRoundsOverRounds({
      order: 1,
      outerCount: 3,
      header: "Demo 3 outer rounds × inner",
      rows: [],
      subSchemas: [
        compositeRoundsWithRest({
          order: 1,
          count: 5,
          rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3,
          header: "Demo inner 5 rounds",
          rows: [
            mkRow(
              1,
              { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.thruster } },
              { load: absoluteLoad(singleWeight(40)), reps: countReps(10) },
            ),
          ],
        }),
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
    nestedRoundsOverParallelLadder({
      order: 1,
      outerCount: 2,
      header: "Demo nested rounds over parallel ladder",
      rows: [],
      subSchemas: [
        parallelLaddersMixedDirection({
          order: 1,
          ladders: [
            { steps: [9, 6, 3], direction: "desc" },
            { steps: [3, 6, 9], direction: "asc" },
          ],
          rows: [
            mkRow(1, { rowKind: "INNER_LADDER_MARKER", steps: [9, 6, 3] }),
            mkRow(
              2,
              { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.dbSnatch } },
              {
                load: absoluteLoad(dualWeight(22.5)),
                reps: compoundRepUnitReps(),
                side: alternating("[ alternative ]"),
              },
            ),
            mkRow(3, { rowKind: "INNER_LADDER_MARKER", steps: [3, 6, 9] }),
            mkRow(
              4,
              { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.boxJump } },
              { load: bodyweightLoad(), reps: countReps(10) },
            ),
          ],
        }),
      ],
    }),
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
    nestedCompositeRoundsOverLadder({
      order: 1,
      outerCount: 2,
      rest: REST_BETWEEN_ROUNDS_FIXED_MIN_3,
      header: "Demo nested composite rounds over ladder",
      rows: [],
    }),
  ],
};

export const BLOCK_TIME_WINDOW_OUTER_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-003",
  order: 5,
  labels: [LBL.conditioning],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    timeWindowOuter({
      order: 1,
      window: { startHhMm: "0:00", endHhMm: "20:00" },
      header: "Demo 20-min time window",
      rows: [],
    }),
  ],
};

export const BLOCK_PULL_UPS_DIPS_CYCLE_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-047",
  order: 6,
  labels: [LBL.gymnastics],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    pullUpsDipsCycle({
      order: 1,
      header: "Demo pull-ups + dips cycle",
      rows: [
        mkRow(
          1,
          {
            rowKind: "EXERCISE",
            exercise: {
              form: "cyclical",
              cyclical: {
                primaryExerciseId: EX.strictPullUp,
                secondaryExerciseId: EX.barDip,
                cycles: [
                  { primaryReps: 5, secondaryReps: 5 },
                  { primaryReps: 4, secondaryReps: 6 },
                  { primaryReps: 3, secondaryReps: 7 },
                ],
              },
            },
          },
          { load: bodyweightLoad() },
        ),
      ],
    }),
  ],
};

export const BLOCK_PARALLEL_PYRAMIDS_WK2_TUE: CanonicalBlock = {
  blockInstanceRef: "block-087",
  order: 7,
  labels: [LBL.olympic],
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    parallelPyramids({
      order: 1,
      pyramids: [{ steps: [3, 5, 3] }, { steps: [5, 7, 5] }],
      header: "Demo parallel pyramids",
      rows: [
        mkRow(
          1,
          { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.powerSnatch } },
          { load: absoluteLoad(singleWeight(50)) },
        ),
      ],
    }),
  ],
};
