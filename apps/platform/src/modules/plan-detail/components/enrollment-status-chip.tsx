import type { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { StatusChip } from "@repo/ui";

import { ENROLLMENT_STATUS_CHIPS } from "@app/lib/config";

type EnrollmentStatusChipProps = {
  status: EnrollmentStatus;
};

export const EnrollmentStatusChip: React.FC<EnrollmentStatusChipProps> = ({ status }) => (
  <StatusChip {...ENROLLMENT_STATUS_CHIPS[status]} />
);
