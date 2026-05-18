"use client";

import { TextField } from "@mui/material";

import { BLOCK_CONSTANTS } from "@repo/contracts/lms/block";

import { useBlurCommit } from "@app/lib/hooks";

type BlockNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const BlockNotesField = ({ value, onCommit }: BlockNotesFieldProps) => {
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

  return (
    <TextField
      label="Block notes"
      placeholder="Notes for this block…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: BLOCK_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
