import { ENROLLMENT_STATUS_LABELS, EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import type { StatusChipConfig } from "@repo/ui";

export const ENROLLMENT_STATUS_CHIPS: Record<EnrollmentStatus, StatusChipConfig> = {
  [EnrollmentStatus.ACTIVE]: {
    label: ENROLLMENT_STATUS_LABELS[EnrollmentStatus.ACTIVE],
    color: "success",
  },
  [EnrollmentStatus.PAUSED]: {
    label: ENROLLMENT_STATUS_LABELS[EnrollmentStatus.PAUSED],
    color: "warning",
  },
  [EnrollmentStatus.REMOVED]: {
    label: ENROLLMENT_STATUS_LABELS[EnrollmentStatus.REMOVED],
  },
};
