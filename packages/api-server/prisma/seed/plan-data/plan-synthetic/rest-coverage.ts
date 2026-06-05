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
  intensity: null,
  timeCap: null,
  notes: null,
  schemas: [
    buildComposeNode(
      {
        order: 1,
        header: "rest-spec coverage block",
        rows: [
          mkRow(
            1,
            { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: EX.burpee } },
            { load: bodyweightLoad(), reps: countReps(10) },
          ),
          mkRow(2, {
            rowKind: "REST",
            raw: "Rest 2-3 min between rounds",
            parsed: REST_BR_RANGE_MIN,
          }),
          mkRow(3, {
            rowKind: "REST",
            raw: "Rest 60-90 sec between sets",
            parsed: REST_BS_RANGE_SEC,
          }),
          mkRow(4, {
            rowKind: "REST",
            raw: "Rest between sets until recovery",
            parsed: REST_BS_UNTIL_RECOVERY,
          }),
          mkRow(5, {
            rowKind: "REST",
            raw: "Rest 3 min between rounds",
            parsed: REST_BR_FIXED_MIN,
          }),
          mkRow(6, {
            rowKind: "REST",
            raw: "Rest 30 sec between intervals",
            parsed: REST_BI_FIXED_SEC,
          }),
        ],
      },
      rounds(5),
      null,
    ),
  ],
};
