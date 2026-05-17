"use client";

import { TextField } from "@mui/material";

import { SESSION_CONSTANTS } from "@repo/contracts/lms/session";

import { useBlurCommit } from "@app/lib/hooks";

type SessionNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const SessionNotesField = ({ value, onCommit }: SessionNotesFieldProps) => {
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({ value, onCommit });

  return (
    <TextField
      label="Session notes"
      placeholder="Notes for this session…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: SESSION_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
