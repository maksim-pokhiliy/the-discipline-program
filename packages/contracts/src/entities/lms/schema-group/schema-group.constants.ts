export const PARALLEL_INTERLEAVE_ORDERS = ["round_by_round", "track_by_track"] as const;
export type ParallelInterleaveOrder = (typeof PARALLEL_INTERLEAVE_ORDERS)[number];

export const DEFAULT_INTERLEAVE_ORDER: ParallelInterleaveOrder = "round_by_round";
