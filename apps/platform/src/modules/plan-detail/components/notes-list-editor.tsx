"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Button, IconButton, Stack, TextField } from "@mui/material";

import { NOTE_MAX_LENGTH, NOTES_MAX_COUNT } from "@repo/contracts/lms/_shared";

const DEFAULT_ADD_LABEL = "add note";
const DEFAULT_ARIA_LABEL = "Notes";
const REMOVE_ARIA = "Remove note";
const NOTE_ROWS = 2;
const EMPTY_NOTE = "";

export type NotesListEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  maxCount?: number;
  maxLength?: number;
  addLabel?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export const NotesListEditor = ({
  value,
  onChange,
  maxCount = NOTES_MAX_COUNT,
  maxLength = NOTE_MAX_LENGTH,
  addLabel = DEFAULT_ADD_LABEL,
  placeholder,
  ariaLabel = DEFAULT_ARIA_LABEL,
  disabled = false,
}: NotesListEditorProps): React.ReactElement => {
  const isAtCap = value.length >= maxCount;

  const updateNote = (index: number, next: string): void => {
    onChange(value.map((note, i) => (i === index ? next : note)));
  };

  const removeNote = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addNote = (): void => {
    onChange([...value, EMPTY_NOTE]);
  };

  return (
    <Stack spacing={1}>
      {value.map((note, index) => (
        <Stack key={index} direction="row" spacing={0.5} sx={{ alignItems: "flex-start" }}>
          <TextField
            fullWidth
            multiline
            minRows={NOTE_ROWS}
            size="small"
            aria-label={`${ariaLabel} ${index + 1}`}
            value={note}
            onChange={(e) => updateNote(index, e.target.value)}
            inputProps={{ maxLength }}
            disabled={disabled}
            {...(placeholder !== undefined && { placeholder })}
          />

          <IconButton
            aria-label={REMOVE_ARIA}
            size="small"
            onClick={() => removeNote(index)}
            disabled={disabled}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}

      <Button
        size="tiny"
        variant="text"
        onClick={addNote}
        disabled={disabled || isAtCap}
        sx={{ alignSelf: "flex-start" }}
      >
        {addLabel}
      </Button>
    </Stack>
  );
};
