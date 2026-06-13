"use client";

import { Stack, Typography } from "@mui/material";

import { formatDateParam } from "@repo/shared";

import { useUpdateWeekNotes } from "@app/lib/hooks";

import { NotesListField } from "./notes-list-field";

const NOTES_PLACEHOLDER = "optional — coach reminder";
const NOTES_ARIA = "Week notes";

type WeekNotesProps = {
  planId: string;
  monday: Date;
  notes: string[] | null;
};

export const WeekNotes: React.FC<WeekNotesProps> = ({ planId, monday, notes }) => {
  const updateNotes = useUpdateWeekNotes(planId);

  const handleCommit = (next: string[] | null) =>
    updateNotes.mutate({ startDate: formatDateParam(monday), data: { notes: next } });

  return (
    <Stack direction="row" alignItems="flex-start" spacing={1.25} sx={{ px: 0.5 }}>
      <Typography variant="overline" color="primary" sx={{ flexShrink: 0, pt: 0.5 }}>
        Week note
      </Typography>
      <NotesListField
        value={notes}
        onCommit={handleCommit}
        placeholder={NOTES_PLACEHOLDER}
        ariaLabel={NOTES_ARIA}
      />
    </Stack>
  );
};
