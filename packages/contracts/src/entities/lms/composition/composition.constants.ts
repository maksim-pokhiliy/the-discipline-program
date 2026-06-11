export const REPETITION_AXIS_KINDS = [
  "once",
  "count",
  "ladder",
  "timeCap",
  "cadence",
  "interval",
] as const;
export type RepetitionAxisKind = (typeof REPETITION_AXIS_KINDS)[number];
