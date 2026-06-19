import { type ReactElement } from "react";

import { Box, Typography } from "@mui/material";

import { type BenchmarkSchema } from "../utils/athlete-session-presentation";
import {
  CARD_RADIUS_PX,
  COMPLETION_EYEBROW_LABEL,
  COMPLETION_READY_BODY_LABEL,
  COMPLETION_READY_TITLE_LABEL,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  RAIL_CARD_BODY_LINE_HEIGHT,
  RAIL_CARD_BODY_PX,
  RAIL_CARD_PADDING_PX,
  RAIL_CARD_TITLE_PX,
  RAIL_EYEBROW_LETTER_SPACING,
  RAIL_EYEBROW_PX,
} from "../utils/athlete-session.constants";

import { CompletionDoneCard } from "./completion-done-card";
import { CompletionReadyCard } from "./completion-ready-card";

export type CompletionRailProps = {
  isLoggingState: boolean;
  completedLabel: string | null;
  benchmarks: BenchmarkSchema[];
  note: string;
  isSubmitting: boolean;
  onNote: (value: string) => void;
  onConfirm: () => void;
  onReopen: () => void;
};

export const CompletionRail = ({
  isLoggingState,
  completedLabel,
  benchmarks,
  note,
  isSubmitting,
  onNote,
  onConfirm,
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
    {isLoggingState ? (
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${CARD_RADIUS_PX}px`,
          bgcolor: theme.palette.background.paper,
          p: `${RAIL_CARD_PADDING_PX}px`,
        })}
      >
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(RAIL_CARD_TITLE_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: theme.palette.text.primary,
          })}
        >
          {COMPLETION_READY_TITLE_LABEL}
        </Typography>
        <Typography
          component="div"
          sx={(theme) => ({
            mt: 0.75,
            fontSize: theme.typography.pxToRem(RAIL_CARD_BODY_PX),
            lineHeight: RAIL_CARD_BODY_LINE_HEIGHT,
            color: theme.palette.text.secondary,
          })}
        >
          {COMPLETION_READY_BODY_LABEL}
        </Typography>
        <Box sx={{ mt: 2.25 }}>
          <CompletionReadyCard
            benchmarks={benchmarks}
            note={note}
            isSubmitting={isSubmitting}
            onNote={onNote}
            onConfirm={onConfirm}
          />
        </Box>
      </Box>
    ) : (
      <CompletionDoneCard
        completedLabel={completedLabel}
        benchmarks={benchmarks}
        onReopen={onReopen}
      />
    )}
  </Box>
);
