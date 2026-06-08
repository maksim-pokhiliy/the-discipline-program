import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
import type { ArrangementAxis, ParallelInterleaveOrder } from "@repo/contracts/lms/composition";

export const ARRANGEMENT_LABELS: Record<ArrangementAxis["kind"], string> = {
  ordered: "ordered",
  parallel: "parallel",
  superset: "superset",
};

export const INTERLEAVE_ORDER_LABELS: Record<ParallelInterleaveOrder, string> = {
  round_by_round: "round by round",
  track_by_track: "track by track",
};

export const PROGRAM_KIND_LABELS: Record<StagedProgramKind, string> = {
  wave: "wave",
  cluster: "cluster",
  drop_set: "drop set",
};
