import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SyncIcon from "@mui/icons-material/Sync";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type { MobilePublishAction } from "@repo/contracts/coaching/mobile-publish";
import type { StatusChipConfig } from "@repo/ui";

export const PUBLISH_RESULT_CHIPS: Record<MobilePublishAction, StatusChipConfig> = {
  created: {
    label: "Created",
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
    tooltip: "Published a new day to the app.",
  },
  updated: {
    label: "Updated",
    color: "info",
    icon: <SyncIcon fontSize="small" />,
    tooltip: "Replaced the day you previously published here.",
  },
  skipped: {
    label: "Skipped",
    color: "default",
    icon: <RemoveCircleOutlineIcon fontSize="small" />,
    tooltip: "Already up to date — nothing to publish.",
  },
  conflict: {
    label: "Conflict",
    color: "warning",
    icon: <WarningAmberIcon fontSize="small" />,
    tooltip: "A program already exists for this day that wasn't published from here.",
  },
  failed: {
    label: "Failed",
    color: "error",
    icon: <ErrorOutlineIcon fontSize="small" />,
    tooltip: "Couldn't publish this day — try again.",
  },
};
