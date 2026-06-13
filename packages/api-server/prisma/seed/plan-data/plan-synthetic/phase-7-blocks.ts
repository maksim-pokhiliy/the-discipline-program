import {
  bodyweightLoad,
  buildComposeNode,
  countReps,
  fullTempo,
  hrZone,
  percentageLoad,
  percentageRefSelf,
  restBetweenIntervals,
  rounds,
  rpe,
  unitBoundReps,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

export const BLOCK_HR_Z2_RUN: CanonicalBlock = {
  blockInstanceRef: "block-160",
  order: 1,
  labels: [LBL.endurance],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "HR Z2 base run 60 min",
        intensity: hrZone("Z2"),
        rows: [
          mkRow(1, EX.run, { reps: unitBoundReps({ unit: "min", value: 60 }) }),
          mkRow(2, EX.run, {
            reps: unitBoundReps({ unit: "min", value: 5 }),
            notes: ["Z1 cooldown"],
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_NUMERIC_PACE_ROW: CanonicalBlock = {
  blockInstanceRef: "block-161",
  order: 1,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Row intervals at numeric pace",
        intensity: {
          numericPace: { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" },
          hrZone: { zone: "Z3" },
        },
        rows: [
          mkRow(1, EX.rowErg, { reps: unitBoundReps({ unit: "min", value: 5 }) }),
          mkRow(2, EX.rowErg, {
            reps: unitBoundReps({ unit: "min", value: 3 }),
            notes: ["pace 240 km/min, HR Z4"],
          }),
          mkRow(3, EX.rowErg, {
            reps: unitBoundReps({ unit: "min", value: 1 }),
            notes: ["pace 1:40/m, HR Z5"],
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_TEMPO_BACK_SQUAT: CanonicalBlock = {
  blockInstanceRef: "block-162",
  order: 1,
  labels: [LBL.strength],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Tempo Back Squat 75% self",
        rows: [
          mkRow(1, EX.backSquat, {
            load: percentageLoad(75, percentageRefSelf()),
            reps: countReps(5),
            tempo: fullTempo({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 }),
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

export const BLOCK_SNATCH_WAVE: CanonicalBlock = {
  blockInstanceRef: "block-163",
  order: 1,
  labels: [LBL.olympic],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "Snatch wave 70/80/90",
        intensity: rpe(8),
        notes: ["RPE 7 / 8 / 9 across the wave"],
        rows: [
          mkRow(1, EX.bbSnatch, {
            load: percentageLoad(70, percentageRefSelf()),
            reps: countReps(3),
          }),
          mkRow(2, EX.bbSnatch, {
            load: percentageLoad(80, percentageRefSelf()),
            reps: countReps(2),
          }),
          mkRow(3, EX.bbSnatch, {
            load: percentageLoad(90, percentageRefSelf()),
            reps: countReps(1),
          }),
        ],
      },
      {},
      null,
    ),
  ],
};

const REST_BETWEEN_INTERVALS_SEC = restBetweenIntervals({ value: 15, unit: "sec" }, "fixed");

export const BLOCK_PULL_UP_CLUSTER: CanonicalBlock = {
  blockInstanceRef: "block-164",
  order: 1,
  labels: [LBL.gymnastics],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "strict pull-up cluster 5 × (3+3+3)",
        notes: ["15 sec cap"],
        rows: [mkRow(1, EX.strictPullUp, { load: bodyweightLoad(), reps: countReps(3) })],
      },
      { ...rounds(5), rest: REST_BETWEEN_INTERVALS_SEC },
      null,
    ),
  ],
};
