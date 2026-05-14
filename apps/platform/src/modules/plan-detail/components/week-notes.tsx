"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@mui/material";

import { formatDateParam } from "@repo/shared";

import { useUpdateWeekNotes } from "@app/lib/hooks";

type WeekNotesProps = {
  planId: string;
  monday: Date;
  notes: string | null;
};

export const WeekNotes: React.FC<WeekNotesProps> = ({ planId, monday, notes }) => {
  const updateNotes = useUpdateWeekNotes(planId);
  const [draft, setDraft] = useState(notes ?? "");
  const committedRef = useRef(notes ?? "");
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(notes ?? "");
      committedRef.current = notes ?? "";
    }
  }, [notes]);

  const commit = () => {
    isFocusedRef.current = false;

    const trimmed = draft.trim();

    if (trimmed === committedRef.current) {
      setDraft(committedRef.current);

      return;
    }

    committedRef.current = trimmed;
    setDraft(trimmed);
    updateNotes.mutate({
      startDate: formatDateParam(monday),
      data: { notes: trimmed === "" ? null : trimmed },
    });
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    committedRef.current = notes ?? "";
  };

  return (
    <TextField
      label="Week notes"
      placeholder="Add week notes…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={commit}
      multiline
      minRows={2}
      fullWidth
      size="small"
    />
  );
};
