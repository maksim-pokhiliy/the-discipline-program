import { type ReactElement } from "react";

import { alpha, Box, Button, Drawer, Typography } from "@mui/material";

import { type BenchmarkSchema } from "../utils/athlete-session-presentation";
import {
  CANCEL_BUTTON_HEIGHT_PX,
  CANCEL_LABEL,
  FONT_WEIGHT_SEMI_BOLD,
  LOG_SESSION_SUBTITLE_BENCHMARK,
  LOG_SESSION_SUBTITLE_PLAIN,
  LOG_SESSION_TITLE,
  SHEET_HANDLE_ALPHA,
  SHEET_HANDLE_HEIGHT_PX,
  SHEET_HANDLE_WIDTH_PX,
  SHEET_MAX_HEIGHT,
  SHEET_PADDING_BOTTOM_PX,
  SHEET_PADDING_TOP_PX,
  SHEET_PADDING_X_PX,
  SHEET_RADIUS_PX,
  SHEET_SUBTITLE_LINE_HEIGHT,
  SHEET_SUBTITLE_PX,
  SHEET_TITLE_ALPHA,
  SHEET_TITLE_PX,
} from "../utils/athlete-session.constants";
import { type ResultDraft } from "../utils/result-form-config";

import { CompletionReadyCard } from "./completion-ready-card";

export type CompletionSheetProps = {
  open: boolean;
  benchmarks: BenchmarkSchema[];
  drafts: Record<string, ResultDraft>;
  note: string;
  canConfirm: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onDraftField: (schemaId: string, key: string, value: string) => void;
  onNote: (value: string) => void;
  onConfirm: () => void;
};

export const CompletionSheet = ({
  open,
  benchmarks,
  drafts,
  note,
  canConfirm,
  isSubmitting,
  onClose,
  onDraftField,
  onNote,
  onConfirm,
}: CompletionSheetProps): ReactElement => {
  const subtitle =
    benchmarks.length > 0 ? LOG_SESSION_SUBTITLE_BENCHMARK : LOG_SESSION_SUBTITLE_PLAIN;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (theme) => ({
            bgcolor: theme.palette.background.paper,
            borderTopLeftRadius: SHEET_RADIUS_PX,
            borderTopRightRadius: SHEET_RADIUS_PX,
            maxHeight: SHEET_MAX_HEIGHT,
            pt: `${SHEET_PADDING_TOP_PX}px`,
            px: `${SHEET_PADDING_X_PX}px`,
            pb: `${SHEET_PADDING_BOTTOM_PX}px`,
          }),
        },
      }}
    >
      <Box
        sx={(theme) => ({
          width: SHEET_HANDLE_WIDTH_PX,
          height: SHEET_HANDLE_HEIGHT_PX,
          mx: "auto",
          mb: 1.5,
          borderRadius: `${SHEET_HANDLE_HEIGHT_PX}px`,
          bgcolor: alpha(theme.palette.common.white, SHEET_HANDLE_ALPHA),
        })}
      />

      <Typography
        component="div"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(SHEET_TITLE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          color: alpha(theme.palette.common.white, SHEET_TITLE_ALPHA),
        })}
      >
        {LOG_SESSION_TITLE}
      </Typography>
      <Typography
        component="div"
        sx={(theme) => ({
          mt: 0.5,
          mb: 2,
          fontSize: theme.typography.pxToRem(SHEET_SUBTITLE_PX),
          lineHeight: SHEET_SUBTITLE_LINE_HEIGHT,
          color: theme.palette.text.secondary,
        })}
      >
        {subtitle}
      </Typography>

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

      <Button
        fullWidth
        variant="text"
        color="inherit"
        onClick={onClose}
        sx={(theme) => ({
          mt: 0.75,
          height: CANCEL_BUTTON_HEIGHT_PX,
          color: theme.palette.text.secondary,
        })}
      >
        {CANCEL_LABEL}
      </Button>
    </Drawer>
  );
};
