import { type ReactElement } from "react";

import EditNoteRounded from "@mui/icons-material/EditNoteRounded";
import { alpha, Box, Button, Stack } from "@mui/material";

import { type Result, type ResultType } from "@repo/contracts/lms/_shared";

import {
  CANCEL_LABEL,
  LOG_AGAIN_LABEL,
  LOG_PANEL_ACTION_GAP_PX,
  LOG_PANEL_PADDING_X_PX,
  LOG_PANEL_PADDING_Y_PX,
  LOG_PANEL_PROMPT_BG_ALPHA,
  LOG_PANEL_PROMPT_BORDER_ALPHA,
  LOG_PANEL_PROMPT_HEIGHT_PX,
  LOG_PANEL_TOP_BORDER_ALPHA,
  LOG_RESULT_PROMPT_LABEL,
  SAVE_RESULT_LABEL,
} from "../utils/athlete-session.constants";
import { isResultDraftValid, type ResultDraft } from "../utils/result-form-config";

import { LoggedResultStrip } from "./logged-result-strip";
import { ResultForm } from "./result-form";

export type BenchmarkLogPanelProps = {
  schemaId: string;
  resultType: ResultType;
  title: string;
  existingResult: Result | null;
  draft: ResultDraft;
  isPending: boolean;
  isOpen: boolean;
  onOpen: (schemaId: string) => void;
  onSave: (schemaId: string, resultType: ResultType) => void;
  onCancel: () => void;
  onChange: (schemaId: string, key: string, value: string) => void;
};

export const BenchmarkLogPanel = ({
  schemaId,
  resultType,
  title,
  existingResult,
  draft,
  isPending,
  isOpen,
  onOpen,
  onSave,
  onCancel,
  onChange,
}: BenchmarkLogPanelProps): ReactElement => {
  if (isOpen) {
    return (
      <Box
        sx={(theme) => ({
          px: `${LOG_PANEL_PADDING_X_PX}px`,
          pb: `${LOG_PANEL_PADDING_Y_PX}px`,
          borderTop: `1px solid ${alpha(theme.palette.success.main, LOG_PANEL_TOP_BORDER_ALPHA)}`,
        })}
      >
        <ResultForm
          title={title}
          resultType={resultType}
          draft={draft}
          onChange={(key, value) => onChange(schemaId, key, value)}
        />
        <Stack direction="row" spacing={`${LOG_PANEL_ACTION_GAP_PX}px`} sx={{ mt: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            disabled={isPending || !isResultDraftValid(resultType, draft)}
            onClick={() => onSave(schemaId, resultType)}
          >
            {SAVE_RESULT_LABEL}
          </Button>
          <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>
            {CANCEL_LABEL}
          </Button>
        </Stack>
      </Box>
    );
  }

  if (existingResult !== null) {
    return (
      <Box
        sx={(theme) => ({
          borderTop: `1px solid ${alpha(theme.palette.success.main, LOG_PANEL_TOP_BORDER_ALPHA)}`,
        })}
      >
        <LoggedResultStrip result={existingResult} />
        <Box sx={{ px: `${LOG_PANEL_PADDING_X_PX}px`, py: `${LOG_PANEL_PADDING_Y_PX}px` }}>
          <Button
            fullWidth
            variant="outlined"
            color="success"
            startIcon={<EditNoteRounded />}
            onClick={() => onOpen(schemaId)}
          >
            {LOG_AGAIN_LABEL}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        px: `${LOG_PANEL_PADDING_X_PX}px`,
        py: `${LOG_PANEL_PADDING_Y_PX}px`,
        borderTop: `1px solid ${alpha(theme.palette.success.main, LOG_PANEL_TOP_BORDER_ALPHA)}`,
      })}
    >
      <Button
        fullWidth
        variant="outlined"
        color="success"
        startIcon={<EditNoteRounded />}
        onClick={() => onOpen(schemaId)}
        sx={(theme) => ({
          height: LOG_PANEL_PROMPT_HEIGHT_PX,
          bgcolor: alpha(theme.palette.success.main, LOG_PANEL_PROMPT_BG_ALPHA),
          borderColor: alpha(theme.palette.success.main, LOG_PANEL_PROMPT_BORDER_ALPHA),
        })}
      >
        {LOG_RESULT_PROMPT_LABEL}
      </Button>
    </Box>
  );
};
