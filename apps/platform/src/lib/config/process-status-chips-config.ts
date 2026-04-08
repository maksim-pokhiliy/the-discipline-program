import { createElement } from "react";

import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import { PROCESS_STATUS_LABELS, ProcessStatus } from "@repo/contracts/coach-dashboard";
import type { StatusChipConfig } from "@repo/ui";

export const PROCESS_STATUS_CHIPS: Record<ProcessStatus, StatusChipConfig> = {
  [ProcessStatus.ON_TRACK]: {
    label: PROCESS_STATUS_LABELS[ProcessStatus.ON_TRACK],
    color: "success",
    icon: createElement(TrendingUpIcon, { fontSize: "small" }),
    tooltip: "Adherence improving compared to previous week",
  },
  [ProcessStatus.STEADY]: {
    label: PROCESS_STATUS_LABELS[ProcessStatus.STEADY],
    icon: createElement(TrendingFlatIcon, { fontSize: "small" }),
    tooltip: "Consistent adherence week over week",
  },
  [ProcessStatus.FALLING_BEHIND]: {
    label: PROCESS_STATUS_LABELS[ProcessStatus.FALLING_BEHIND],
    color: "error",
    icon: createElement(TrendingDownIcon, { fontSize: "small" }),
    tooltip: "Adherence declining compared to previous week",
  },
};
