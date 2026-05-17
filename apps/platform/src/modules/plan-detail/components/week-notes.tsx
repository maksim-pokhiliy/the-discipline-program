"use client";

import { TextField } from "@mui/material";

import { formatDateParam } from "@repo/shared";

import { useBlurCommit, useUpdateWeekNotes } from "@app/lib/hooks";

type WeekNotesProps = {
  planId: string;
  monday: Date;
  notes: string | null;
};

export const WeekNotes: React.FC<WeekNotesProps> = ({ planId, monday, notes }) => {
  const updateNotes = useUpdateWeekNotes(planId);
  const { draft, setDraft, handleFocus, handleBlur } = useBlurCommit({
    value: notes,
    onCommit: (next) =>
      updateNotes.mutate({
        startDate: formatDateParam(monday),
        data: { notes: next },
      }),
  });

  return (
    <TextField
      label="Week notes"
      placeholder="Add week notes…"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      multiline
      minRows={2}
      fullWidth
      size="small"
    />
  );
};
