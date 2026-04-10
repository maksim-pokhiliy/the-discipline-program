import type { ChipProps } from "@mui/material";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

export const ALL_TAB = "ALL" as const;

type StatusTab = {
  value: TrainingPlanStatus | typeof ALL_TAB;
  label: string;
  chipColor: ChipProps["color"];
};

export const STATUS_TABS: StatusTab[] = [
  { value: ALL_TAB, label: "All", chipColor: "default" },
  { value: TrainingPlanStatus.ACTIVE, label: "Active", chipColor: "success" },
  { value: TrainingPlanStatus.DRAFT, label: "Drafts", chipColor: "default" },
  { value: TrainingPlanStatus.ARCHIVED, label: "Archived", chipColor: "warning" },
];
