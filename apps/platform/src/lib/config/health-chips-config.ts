import { createElement } from "react";

import HealingIcon from "@mui/icons-material/Healing";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import { HEALTH_STATUS_LABELS, HealthStatus } from "@repo/contracts/athlete-profile";

import type { StatusChipConfig } from "../components/status-chip";

export const HEALTH_STATUS_CHIPS: Record<HealthStatus, StatusChipConfig> = {
  [HealthStatus.HEALTHY]: {
    label: HEALTH_STATUS_LABELS[HealthStatus.HEALTHY],
    color: "success",
    icon: createElement(HealthAndSafetyIcon, { fontSize: "small" }),
  },
  [HealthStatus.INJURED]: {
    label: HEALTH_STATUS_LABELS[HealthStatus.INJURED],
    color: "error",
    icon: createElement(LocalHospitalIcon, { fontSize: "small" }),
  },
  [HealthStatus.RESTRICTED]: {
    label: HEALTH_STATUS_LABELS[HealthStatus.RESTRICTED],
    color: "warning",
    icon: createElement(HealingIcon, { fontSize: "small" }),
  },
};

export const getHealthChipFromMessage = (message: string): StatusChipConfig | null => {
  const lower = message.toLowerCase();

  for (const [status, chip] of Object.entries(HEALTH_STATUS_CHIPS)) {
    if (lower.includes(status.toLowerCase())) {
      return chip;
    }
  }

  return null;
};
