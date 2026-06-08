export const REPETITION_AXIS_KINDS = [
  "once",
  "count",
  "range",
  "ladder",
  "timeCap",
  "cadence",
  "window",
  "interval",
] as const;
export type RepetitionAxisKind = (typeof REPETITION_AXIS_KINDS)[number];

export const ARRANGEMENT_AXIS_KINDS = ["ordered", "parallel", "superset"] as const;
export type ArrangementAxisKind = (typeof ARRANGEMENT_AXIS_KINDS)[number];

export const PARALLEL_INTERLEAVE_ORDERS = ["round_by_round", "track_by_track"] as const;
export type ParallelInterleaveOrder = (typeof PARALLEL_INTERLEAVE_ORDERS)[number];

export const WINDOW_HH_MM_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
