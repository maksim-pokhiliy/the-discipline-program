import { createElement } from "react";

import HealingIcon from "@mui/icons-material/Healing";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import type { ChipProps } from "@mui/material";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/athlete-profile";

export type HealthChipConfig = {
  label: string;
  color: ChipProps["color"];
  icon?: React.ReactElement;
};

const HEALTH_CHIPS: Partial<Record<HealthStatus, HealthChipConfig>> = {
  [HealthStatus.INJURED]: {
    label: HEALTH_STATUS_LABELS[HealthStatus.INJURED],
    color: "error",
    icon: createElement(LocalHospitalIcon),
  },
  [HealthStatus.RESTRICTED]: {
    label: HEALTH_STATUS_LABELS[HealthStatus.RESTRICTED],
    color: "warning",
    icon: createElement(HealingIcon),
  },
};

export const getHealthChip = (status: HealthStatus): HealthChipConfig | null =>
  HEALTH_CHIPS[status] ?? null;

export const getHealthChipFromMessage = (message: string): HealthChipConfig | null => {
  const lower = message.toLowerCase();

  for (const [status, chip] of Object.entries(HEALTH_CHIPS)) {
    if (chip && lower.includes(status.toLowerCase())) {
      return chip;
    }
  }

  return null;
};
