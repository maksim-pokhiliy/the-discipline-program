"use client";

import { type FocusEvent, type ReactElement, useEffect, useRef, useState } from "react";

import { Box } from "@mui/material";

import { NotesListEditor } from "./notes-list-editor";

type NotesListFieldProps = {
  value: string[] | null;
  onCommit: (next: string[] | null) => void;
  maxLength?: number;
  addLabel?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

const trimToCommitted = (draft: string[]): string[] | null => {
  const cleaned = draft.map((note) => note.trim()).filter((note) => note !== "");

  return cleaned.length > 0 ? cleaned : null;
};

const areListsEqual = (a: string[] | null, b: string[] | null): boolean => {
  if (a === null || b === null) {
    return a === b;
  }

  return a.length === b.length && a.every((note, index) => note === b[index]);
};

export const NotesListField = ({
  value,
  onCommit,
  maxLength,
  addLabel,
  placeholder,
  ariaLabel,
  disabled = false,
}: NotesListFieldProps): ReactElement => {
  const [draft, setDraft] = useState<string[]>(value ?? []);
  const committedRef = useRef<string[] | null>(value);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value ?? []);
      committedRef.current = value;
    }
  }, [value]);

  const handleFocus = (): void => {
    isFocusedRef.current = true;
    committedRef.current = value;
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    isFocusedRef.current = false;

    const next = trimToCommitted(draft);

    if (areListsEqual(next, committedRef.current)) {
      setDraft(committedRef.current ?? []);

      return;
    }

    committedRef.current = next;
    setDraft(next ?? []);
    onCommit(next);
  };

  return (
    <Box onFocus={handleFocus} onBlur={handleBlur} sx={{ width: "100%" }}>
      <NotesListEditor
        value={draft}
        onChange={setDraft}
        {...(maxLength !== undefined && { maxLength })}
        {...(addLabel !== undefined && { addLabel })}
        {...(placeholder !== undefined && { placeholder })}
        {...(ariaLabel !== undefined && { ariaLabel })}
        disabled={disabled}
      />
    </Box>
  );
};
