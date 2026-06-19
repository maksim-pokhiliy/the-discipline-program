import { type ReactElement } from "react";

import CheckRounded from "@mui/icons-material/CheckRounded";
import { Button, Stack, TextField } from "@mui/material";

import { type BenchmarkSchema } from "../utils/athlete-session-presentation";
import {
  COMPLETION_BUTTON_HEIGHT_PX,
  CONFIRM_LABEL,
  NOTE_FIELD_LABEL,
  NOTE_FIELD_MAX_LENGTH,
  NOTE_FIELD_PLACEHOLDER,
  NOTE_FIELD_ROWS,
} from "../utils/athlete-session.constants";

import { BenchmarkStatusStrip } from "./benchmark-status-strip";

export type CompletionReadyCardProps = {
  benchmarks: BenchmarkSchema[];
  note: string;
  isSubmitting: boolean;
  onNote: (value: string) => void;
  onConfirm: () => void;
};

export const CompletionReadyCard = ({
  benchmarks,
  note,
  isSubmitting,
  onNote,
  onConfirm,
}: CompletionReadyCardProps): ReactElement => (
  <Stack spacing={2}>
    {benchmarks.map((benchmark) => (
      <BenchmarkStatusStrip
        key={benchmark.schemaId}
        title={benchmark.title}
        result={benchmark.existingResult}
      />
    ))}

    <TextField
      label={NOTE_FIELD_LABEL}
      placeholder={NOTE_FIELD_PLACEHOLDER}
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
      disabled={isSubmitting}
      sx={{ height: COMPLETION_BUTTON_HEIGHT_PX }}
    >
      {CONFIRM_LABEL}
    </Button>
  </Stack>
);
