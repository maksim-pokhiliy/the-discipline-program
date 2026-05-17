"use client";

import { TextField } from "@mui/material";

import { DAY_CONSTANTS } from "@repo/contracts/lms/day";

import { useBlurCommit } from "@app/lib/hooks";

type DayNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const DayNotesField = ({ value, onCommit }: DayNotesFieldProps) => {
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

  return (
    <TextField
      label="Day notes"
      placeholder="Notes for this day…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: DAY_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
