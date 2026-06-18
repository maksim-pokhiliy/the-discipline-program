import { type ReactElement } from "react";

import CheckRounded from "@mui/icons-material/CheckRounded";
import { Button, Stack, TextField } from "@mui/material";

import { type BenchmarkSchema } from "../utils/athlete-session-presentation";
import {
  COMPLETION_BUTTON_HEIGHT_PX,
  CONFIRM_LABEL,
  NOTE_FIELD_LABEL,
  NOTE_FIELD_MAX_LENGTH,
  NOTE_FIELD_ROWS,
} from "../utils/athlete-session.constants";
import { type ResultDraft } from "../utils/result-form-config";

import { ResultForm } from "./result-form";

export type CompletionReadyCardProps = {
  benchmarks: BenchmarkSchema[];
  drafts: Record<string, ResultDraft>;
  note: string;
  canConfirm: boolean;
  isSubmitting: boolean;
  onDraftField: (schemaId: string, key: string, value: string) => void;
  onNote: (value: string) => void;
  onConfirm: () => void;
};

export const CompletionReadyCard = ({
  benchmarks,
  drafts,
  note,
  canConfirm,
  isSubmitting,
  onDraftField,
  onNote,
  onConfirm,
}: CompletionReadyCardProps): ReactElement => (
  <Stack spacing={2}>
    {benchmarks.map((benchmark) => (
      <ResultForm
        key={benchmark.schemaId}
        title={benchmark.title}
        resultType={benchmark.resultType}
        draft={drafts[benchmark.schemaId] ?? {}}
        onChange={(key, value) => onDraftField(benchmark.schemaId, key, value)}
      />
    ))}

    <TextField
      label={NOTE_FIELD_LABEL}
      value={note}
      onChange={(event) => onNote(event.target.value)}
      fullWidth
      multiline
      rows={NOTE_FIELD_ROWS}
      slotProps={{ htmlInput: { maxLength: NOTE_FIELD_MAX_LENGTH } }}
    />

    <Button
      fullWidth
      variant="contained"
      color="primary"
      startIcon={<CheckRounded />}
      onClick={onConfirm}
      disabled={!canConfirm || isSubmitting}
      sx={{ height: COMPLETION_BUTTON_HEIGHT_PX }}
    >
      {CONFIRM_LABEL}
    </Button>
  </Stack>
);
