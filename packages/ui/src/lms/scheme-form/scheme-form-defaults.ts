import { type SchemeArchetypeKind, type SchemeParams } from "@repo/contracts/lms/_domain";

export const SCHEME_PARAMS_DEFAULTS: {
  [K in SchemeArchetypeKind]: Extract<SchemeParams, { kind: K }>;
} = {
  NONE: { kind: "NONE" },
  COUNT_UP: { kind: "COUNT_UP" },
  COUNT_DOWN: { kind: "COUNT_DOWN", durationSec: 600 },
  INTERVAL_LOOP: {
    kind: "INTERVAL_LOOP",
    sets: 5,
    slots: [
      { durationSec: 30, action: "WORK" },
      { durationSec: 30, action: "REST" },
    ],
  },
  EMOM_LOOP: {
    kind: "EMOM_LOOP",
    totalMinutes: 10,
    slots: [{ minutes: [0], action: { kind: "ENTRY", entryRefIndex: 0 } }],
  },
  TIME_BOXED: {
    kind: "TIME_BOXED",
    segments: [
      {
        startSec: 0,
        endSec: 600,
        innerArchetypeKind: "NONE",
        innerParams: { kind: "NONE" },
      },
    ],
  },
};
