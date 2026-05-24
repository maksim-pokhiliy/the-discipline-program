"use client";

import { InputBase, Stack, Typography } from "@mui/material";

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
    <Stack direction="row" alignItems="flex-start" spacing={1.25} sx={{ px: 0.5 }}>
      <Typography variant="overline" color="primary" sx={{ flexShrink: 0, pt: 0.5 }}>
        Week note
      </Typography>
      <InputBase
        multiline
        fullWidth
        placeholder="optional — coach reminder"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputProps={{ "aria-label": "Week notes" }}
        sx={{
          flex: 1,
          p: 0,
          ".MuiInputBase-input": { p: 0, typography: "body2", color: "text.secondary" },
        }}
      />
    </Stack>
  );
};
