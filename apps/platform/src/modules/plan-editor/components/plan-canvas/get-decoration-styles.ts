import { type SxProps, type Theme } from "@mui/material";

import { type PlanOverrideKind } from "@repo/contracts/lms/plan-override";

export type EffectiveNodeDecoration = {
  isOverridden: boolean;
  overrideKind: PlanOverrideKind | null;
  notes: string[];
  suspended: boolean;
};

export type DecorationStyles = {
  sx: SxProps<Theme>;
  badgeLabel: string | null;
  badgeColor: "default" | "warning" | "info" | "success" | "error";
  tooltip: string | null;
};

export const getDecorationStyles = (
  decoration: EffectiveNodeDecoration | null,
): DecorationStyles => {
  if (!decoration || !decoration.isOverridden) {
    return { sx: {}, badgeLabel: null, badgeColor: "default", tooltip: null };
  }

  const tooltip = decoration.notes.length > 0 ? decoration.notes.join("\n\n") : null;

  if (decoration.suspended) {
    return {
      sx: {
        opacity: 0.6,
        textDecoration: "line-through",
        outline: "1px dashed",
        outlineColor: "warning.main",
      },
      badgeLabel: "SUSPEND",
      badgeColor: "warning",
      tooltip,
    };
  }

  if (decoration.overrideKind === "REPLACE") {
    return {
      sx: {
        outline: "2px solid",
        outlineColor: "success.main",
        bgcolor: "success.50",
      },
      badgeLabel: "REPLACE",
      badgeColor: "success",
      tooltip,
    };
  }

  if (decoration.overrideKind === "APPEND") {
    return {
      sx: {
        outline: "2px solid",
        outlineColor: "info.main",
        bgcolor: "info.50",
      },
      badgeLabel: "APPEND",
      badgeColor: "info",
      tooltip,
    };
  }

  if (decoration.overrideKind === "NOTE") {
    return {
      sx: { outline: "1px dashed", outlineColor: "info.main" },
      badgeLabel: "NOTE",
      badgeColor: "info",
      tooltip,
    };
  }

  return { sx: {}, badgeLabel: null, badgeColor: "default", tooltip };
};
