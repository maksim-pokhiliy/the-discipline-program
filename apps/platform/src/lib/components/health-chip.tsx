"use client";

import { Chip } from "@mui/material";

import { type HealthStatus } from "@repo/contracts/athlete-profile";

import { getHealthChip } from "@app/lib/config";

type HealthChipProps = {
  healthStatus: HealthStatus;
};

export const HealthChip: React.FC<HealthChipProps> = ({ healthStatus }) => {
  const config = getHealthChip(healthStatus);

  if (!config) {
    return null;
  }

  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      icon={config.icon}
      variant="outlined"
    />
  );
};
