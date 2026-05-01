import type { ChipProps } from "@mui/material";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

export const ENROLLMENT_STATUS_COLORS: Record<
  PlanEnrollmentStatus,
  NonNullable<ChipProps["color"]>
> = {
  [PlanEnrollmentStatus.ACTIVE]: "success",
  [PlanEnrollmentStatus.PAUSED]: "warning",
  [PlanEnrollmentStatus.COMPLETED]: "default",
};
