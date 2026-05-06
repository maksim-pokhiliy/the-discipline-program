import {
  type DistanceUnit,
  type EmomSlotActionKind,
  type IntervalSlotAction,
  type LadderDirection,
  type SchemeArchetypeKind,
  type SchemeParams,
} from "./scheme-archetype.types";

export const SCHEME_ARCHETYPE_KINDS: readonly SchemeArchetypeKind[] = [
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
  "TIME_BOXED",
  "LADDER",
  "DISTANCE",
] as const;

export const SCHEME_ARCHETYPE_KIND_LABELS: Record<SchemeArchetypeKind, string> = {
  NONE: "None",
  COUNT_UP: "Count Up",
  COUNT_DOWN: "Count Down",
  INTERVAL_LOOP: "Interval Loop",
  EMOM_LOOP: "EMOM",
  TIME_BOXED: "Time-Boxed",
  LADDER: "Ladder",
  DISTANCE: "Distance",
};

export const SCHEME_ARCHETYPE_KIND_OPTIONS: ReadonlyArray<{
  value: SchemeArchetypeKind;
  label: string;
}> = SCHEME_ARCHETYPE_KINDS.map((value) => ({
  value,
  label: SCHEME_ARCHETYPE_KIND_LABELS[value],
}));

export const DISTANCE_UNITS: readonly DistanceUnit[] = ["KM", "M", "MI"] as const;

export const DISTANCE_UNIT_LABELS: Record<DistanceUnit, string> = {
  KM: "Kilometers (KM)",
  M: "Meters (M)",
  MI: "Miles (MI)",
};

export const DISTANCE_UNIT_OPTIONS: ReadonlyArray<{ value: DistanceUnit; label: string }> =
  DISTANCE_UNITS.map((value) => ({ value, label: DISTANCE_UNIT_LABELS[value] }));

export const INTERVAL_SLOT_ACTIONS: readonly IntervalSlotAction[] = ["WORK", "REST"] as const;

export const INTERVAL_SLOT_ACTION_LABELS: Record<IntervalSlotAction, string> = {
  WORK: "Work",
  REST: "Rest",
};

export const INTERVAL_SLOT_ACTION_OPTIONS: ReadonlyArray<{
  value: IntervalSlotAction;
  label: string;
}> = INTERVAL_SLOT_ACTIONS.map((value) => ({
  value,
  label: INTERVAL_SLOT_ACTION_LABELS[value],
}));

export const EMOM_SLOT_ACTION_KINDS: readonly EmomSlotActionKind[] = [
  "ENTRY",
  "REST",
  "MAX_OF_ENTRY",
] as const;

export const EMOM_SLOT_ACTION_KIND_LABELS: Record<EmomSlotActionKind, string> = {
  ENTRY: "Entry",
  REST: "Rest",
  MAX_OF_ENTRY: "Max of Entry",
};

export const EMOM_SLOT_ACTION_KIND_OPTIONS: ReadonlyArray<{
  value: EmomSlotActionKind;
  label: string;
}> = EMOM_SLOT_ACTION_KINDS.map((value) => ({
  value,
  label: EMOM_SLOT_ACTION_KIND_LABELS[value],
}));

export const LADDER_DIRECTIONS: readonly LadderDirection[] = ["ASC", "DESC", "PYRAMID"] as const;

export const LADDER_DIRECTION_LABELS: Record<LadderDirection, string> = {
  ASC: "Ascending",
  DESC: "Descending",
  PYRAMID: "Pyramid",
};

export const LADDER_DIRECTION_OPTIONS: ReadonlyArray<{ value: LadderDirection; label: string }> =
  LADDER_DIRECTIONS.map((value) => ({ value, label: LADDER_DIRECTION_LABELS[value] }));

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
    case "LADDER":
      return { kind: "LADDER", sequence: [21, 15, 9], direction: "DESC" };
    case "DISTANCE":
      return { kind: "DISTANCE", unit: "KM", distanceMin: 5 };
  }
}
