"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@mui/material";

import { DAY_CONSTANTS } from "@repo/contracts/lms/day";

type DayNotesFieldProps = {
  value: string | null;
  onCommit: (next: string | null) => void;
};

export const DayNotesField = ({ value, onCommit }: DayNotesFieldProps) => {
  const [draft, setDraft] = useState(value ?? "");
  const committedRef = useRef(value ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value ?? "");
      committedRef.current = value ?? "";
    }
  }, [value]);

  const commit = () => {
    isFocusedRef.current = false;

    const trimmed = draft.trim();

    if (trimmed === committedRef.current) {
      setDraft(committedRef.current);

      return;
    }

    committedRef.current = trimmed;
    setDraft(trimmed);
    onCommit(trimmed === "" ? null : trimmed);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedRef.current = value ?? "";
  };

  return (
    <TextField
      label="Day notes"
      placeholder="Notes for this day…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={commit}
      multiline
      minRows={2}
      fullWidth
      size="small"
      inputProps={{ maxLength: DAY_CONSTANTS.MAX_NOTES_LENGTH }}
    />
  );
};
