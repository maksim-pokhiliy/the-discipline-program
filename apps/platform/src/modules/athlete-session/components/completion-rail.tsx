import { type ReactElement } from "react";

import { Box, Typography } from "@mui/material";

import {
  COMPLETION_EYEBROW_LABEL,
  FONT_WEIGHT_DISPLAY,
  RAIL_EYEBROW_LETTER_SPACING,
  RAIL_EYEBROW_PX,
} from "../utils/athlete-session.constants";

import { CompletionDoneCard } from "./completion-done-card";
import { CompletionReadyCard } from "./completion-ready-card";

export type CompletionRailProps = {
  done: boolean;
  completedLabel: string | null;
  onComplete: () => void;
  onReopen: () => void;
};

export const CompletionRail = ({
  done,
  completedLabel,
  onComplete,
  onReopen,
}: CompletionRailProps): ReactElement => (
  <Box>
    <Typography
      component="div"
      sx={(theme) => ({
        mb: 2,
        fontSize: theme.typography.pxToRem(RAIL_EYEBROW_PX),
        fontWeight: FONT_WEIGHT_DISPLAY,
        letterSpacing: RAIL_EYEBROW_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.text.muted,
      })}
    >
      {COMPLETION_EYEBROW_LABEL}
    </Typography>
    {done ? (
      <CompletionDoneCard completedLabel={completedLabel} onReopen={onReopen} />
    ) : (
      <CompletionReadyCard onComplete={onComplete} />
    )}
  </Box>
);
