export const SCHEME_CONSTANTS = {
  MAX_SLUG_LENGTH: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

export enum SchemeKind {
  STRAIGHT_SETS = "STRAIGHT_SETS",
  FOR_TIME = "FOR_TIME",
  AMRAP = "AMRAP",
  EMOM = "EMOM",
  EVERY_X_MIN = "EVERY_X_MIN",
  INTERVALS = "INTERVALS",
  TIME_BLOCKS = "TIME_BLOCKS",
}

export const SCHEME_KIND_LABELS: Record<SchemeKind, string> = {
  [SchemeKind.STRAIGHT_SETS]: "Straight Sets",
  [SchemeKind.FOR_TIME]: "For Time",
  [SchemeKind.AMRAP]: "AMRAP",
  [SchemeKind.EMOM]: "EMOM",
  [SchemeKind.EVERY_X_MIN]: "Every X Min",
  [SchemeKind.INTERVALS]: "Intervals",
  [SchemeKind.TIME_BLOCKS]: "Time Blocks",
};

export const SCHEME_PARAM_KEYS = [
  "duration",
  "rounds",
  "work",
  "rest",
  "interval",
  "capTime",
  "effortPct",
] as const;

export type SchemeParamKey = (typeof SCHEME_PARAM_KEYS)[number];
