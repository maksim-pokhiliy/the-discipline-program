import { Box, Stack, Typography } from "@mui/material";

import type { CoachAthleteNote } from "@repo/contracts/coaching/coach-athletes";

import { formatRelativeTime } from "../athletes-roster-config";

type NotesPaneProps = {
  notes: CoachAthleteNote[];
};

export const NotesPane: React.FC<NotesPaneProps> = ({ notes }) => {
  if (notes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No coach notes yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      {notes.map((note) => (
        <Box
          key={note.id}
          sx={(theme) => ({
            p: 1.5,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.default",
          })}
        >
          <Typography variant="caption" color="text.muted" display="block" sx={{ mb: 0.5 }}>
            {formatRelativeTime(note.createdAt)}
          </Typography>
          <Typography variant="body2">{note.content}</Typography>
        </Box>
      ))}
    </Stack>
  );
};
