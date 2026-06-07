import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
import type { ArrangementAxis, ScoringDirective } from "@repo/contracts/lms/composition";

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

export const PROGRAM_KIND_LABELS: Record<StagedProgramKind, string> = {
  wave: "wave",
  cluster: "cluster",
  drop_set: "drop set",
};
