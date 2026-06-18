import { type ReactElement } from "react";

import { Box, Typography } from "@mui/material";

import { type BenchmarkSchema } from "../utils/athlete-session-presentation";
import {
  COMPLETION_EYEBROW_LABEL,
  FONT_WEIGHT_DISPLAY,
  RAIL_EYEBROW_LETTER_SPACING,
  RAIL_EYEBROW_PX,
} from "../utils/athlete-session.constants";
import { type ResultDraft } from "../utils/result-form-config";

import { CompletionDoneCard } from "./completion-done-card";
import { CompletionReadyCard } from "./completion-ready-card";

export type CompletionRailProps = {
  isLoggingState: boolean;
  completedLabel: string | null;
  benchmarks: BenchmarkSchema[];
  drafts: Record<string, ResultDraft>;
  note: string;
  canConfirm: boolean;
  isSubmitting: boolean;
  onDraftField: (schemaId: string, key: string, value: string) => void;
  onNote: (value: string) => void;
  onConfirm: () => void;
  onReopen: () => void;
};

export const CompletionRail = ({
  isLoggingState,
  completedLabel,
  benchmarks,
  drafts,
  note,
  canConfirm,
  isSubmitting,
  onDraftField,
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
      <CompletionReadyCard
        benchmarks={benchmarks}
        drafts={drafts}
        note={note}
        canConfirm={canConfirm}
        isSubmitting={isSubmitting}
        onDraftField={onDraftField}
        onNote={onNote}
        onConfirm={onConfirm}
      />
    ) : (
      <CompletionDoneCard completedLabel={completedLabel} onReopen={onReopen} />
    )}
  </Box>
);
