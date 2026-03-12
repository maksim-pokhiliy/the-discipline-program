import type { ChipProps } from "@mui/material";

import { TrainingPlanStatus } from "@repo/contracts/training-plan";

type StatusTab = {
  value: TrainingPlanStatus | "ALL";
  label: string;
  chipColor: ChipProps["color"];
};

export const STATUS_TABS: StatusTab[] = [
  { value: "ALL", label: "All", chipColor: "default" },
  { value: TrainingPlanStatus.ACTIVE, label: "Active", chipColor: "success" },
  { value: TrainingPlanStatus.DRAFT, label: "Drafts", chipColor: "default" },
  { value: TrainingPlanStatus.ARCHIVED, label: "Archived", chipColor: "warning" },
];
