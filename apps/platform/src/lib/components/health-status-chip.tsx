import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { StatusChip } from "@repo/ui";

import { HEALTH_STATUS_CHIPS } from "@app/lib/config";

type HealthStatusChipProps = {
  healthStatus: HealthStatus;
};

export const HealthStatusChip = ({ healthStatus }: HealthStatusChipProps) => {
  if (healthStatus === HealthStatus.HEALTHY) {
    return null;
  }

  return <StatusChip {...HEALTH_STATUS_CHIPS[healthStatus]} />;
};
