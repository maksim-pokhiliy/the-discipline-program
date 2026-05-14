"use client";

import { Stack, Typography } from "@mui/material";

import { formatDateParam } from "@repo/shared";
import { InlineEditText } from "@repo/ui";

import { useUpdateWeekNotes } from "@app/lib/hooks";

type WeekNotesProps = {
  planId: string;
  monday: Date;
  notes: string | null;
};

export const WeekNotes: React.FC<WeekNotesProps> = ({ planId, monday, notes }) => {
  const updateNotes = useUpdateWeekNotes(planId);

  const handleCommit = (next: string) => {
    updateNotes.mutate({
      startDate: formatDateParam(monday),
      data: { notes: next === "" ? null : next },
    });
  };

  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Week notes
      </Typography>
      <InlineEditText
        variant="body2"
        multiline
        emptyIsValid
        value={notes ?? ""}
        ariaLabel="Week notes"
        placeholder="Add week notes…"
        onCommit={handleCommit}
      />
    </Stack>
  );
};
