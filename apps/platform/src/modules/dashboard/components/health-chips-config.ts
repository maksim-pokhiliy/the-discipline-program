import { createElement } from "react";

import HealingIcon from "@mui/icons-material/Healing";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/athlete-profile";

import type { AthleteCardChip } from "./athlete-card";

const HEALTH_CHIPS: Partial<Record<HealthStatus, AthleteCardChip>> = {
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

export const getHealthChip = (status: HealthStatus): AthleteCardChip | null =>
  HEALTH_CHIPS[status] ?? null;

export const getHealthChipFromMessage = (message: string): AthleteCardChip | null => {
  const lower = message.toLowerCase();

  for (const [status, chip] of Object.entries(HEALTH_CHIPS)) {
    if (chip && lower.includes(status.toLowerCase())) {
      return chip;
    }
  }

  return null;
};
