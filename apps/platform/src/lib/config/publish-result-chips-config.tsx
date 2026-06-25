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
  },
  updated: {
    label: "Updated",
    color: "info",
    icon: <SyncIcon fontSize="small" />,
  },
  skipped: {
    label: "Skipped",
    color: "default",
    icon: <RemoveCircleOutlineIcon fontSize="small" />,
  },
  conflict: {
    label: "Conflict",
    color: "warning",
    icon: <WarningAmberIcon fontSize="small" />,
  },
  failed: {
    label: "Failed",
    color: "error",
    icon: <ErrorOutlineIcon fontSize="small" />,
  },
};
