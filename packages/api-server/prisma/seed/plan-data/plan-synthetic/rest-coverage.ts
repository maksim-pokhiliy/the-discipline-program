import {
  bodyweightLoad,
  buildComposeNode,
  countReps,
  restBetweenIntervals,
  restBetweenRounds,
  restBetweenSets,
  rounds,
} from "../builder";
import type { CanonicalBlock } from "../canonical-schema";

import { EX, LBL } from "./refs";
import { mkRow } from "./row-helpers";

const REST_BR_RANGE_MIN = restBetweenRounds({ value: 2, rangeMax: 3, unit: "range_min" }, "range");
const REST_BS_RANGE_SEC = restBetweenSets({ value: 60, rangeMax: 90, unit: "range_sec" }, "range");
const REST_BS_UNTIL_RECOVERY = restBetweenSets({ value: 3, unit: "min" }, "until_recovery");
const REST_BR_FIXED_MIN = restBetweenRounds({ value: 3, unit: "min" }, "fixed");
const REST_BI_FIXED_SEC = restBetweenIntervals({ value: 30, unit: "sec" }, "fixed");

export const BLOCK_REST_COVERAGE: CanonicalBlock = {
  blockInstanceRef: "block-170",
  order: 4,
  labels: [LBL.conditioning],
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "rest-spec coverage — 2-3 min between rounds",
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(10) })],
      },
      { ...rounds(5), rest: REST_BR_RANGE_MIN },
      null,
    ),
    buildComposeNode(
      {
        order: 2,
        header: "rest-spec coverage — 60-90 sec between sets",
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(10) })],
      },
      { ...rounds(5), rest: REST_BS_RANGE_SEC },
      null,
    ),
    buildComposeNode(
      {
        order: 3,
        header: "rest-spec coverage — between sets until recovery",
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(10) })],
      },
      { ...rounds(5), rest: REST_BS_UNTIL_RECOVERY },
      null,
    ),
    buildComposeNode(
      {
        order: 4,
        header: "rest-spec coverage — 3 min between rounds",
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(10) })],
      },
      { ...rounds(5), rest: REST_BR_FIXED_MIN },
      null,
    ),
    buildComposeNode(
      {
        order: 5,
        header: "rest-spec coverage — 30 sec between intervals",
        rows: [mkRow(1, EX.burpee, { load: bodyweightLoad(), reps: countReps(10) })],
      },
      { ...rounds(5), rest: REST_BI_FIXED_SEC },
      null,
    ),
  ],
};
