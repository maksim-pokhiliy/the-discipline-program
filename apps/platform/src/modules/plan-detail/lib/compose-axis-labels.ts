import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
import type {
  ArrangementAxis,
  ParallelInterleaveOrder,
  ScoringDirective,
} from "@repo/contracts/lms/composition";

export const SCORING_LABELS: Record<ScoringDirective["kind"], string> = {
  prescribed: "prescribed",
  amrap: "AMRAP",
  for_time: "for time",
  max_in_remaining: "max-in-remaining",
  total: "total",
  progressive: "progressive",
};

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
