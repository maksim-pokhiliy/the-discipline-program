import { type SchemeArchetypeKind, type SchemeParams } from "./scheme-archetype.types";

export const SCHEME_ARCHETYPE_KINDS: readonly SchemeArchetypeKind[] = [
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
  "TIME_BOXED",
] as const;

export function defaultSchemeParams(kind: SchemeArchetypeKind): SchemeParams {
  switch (kind) {
    case "NONE":
      return { kind: "NONE" };
    case "COUNT_UP":
      return { kind: "COUNT_UP" };
    case "COUNT_DOWN":
      return { kind: "COUNT_DOWN", durationSec: 600 };
    case "INTERVAL_LOOP":
      return {
        kind: "INTERVAL_LOOP",
        sets: 1,
        slots: [{ durationSec: 30, action: "WORK" }],
      };
    case "EMOM_LOOP":
      return {
        kind: "EMOM_LOOP",
        totalMinutes: 10,
        slots: [{ minutes: [0], action: { kind: "REST" } }],
      };
    case "TIME_BOXED":
      return {
        kind: "TIME_BOXED",
        segments: [
          {
            startSec: 0,
            endSec: 600,
            innerArchetypeKind: "NONE",
            innerParams: { kind: "NONE" },
          },
        ],
      };
  }
}
