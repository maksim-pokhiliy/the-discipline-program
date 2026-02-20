"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

import type { DashboardNote } from "@repo/contracts/coach-dashboard";

import { CoachNoteItem } from "../components";

type NotesSectionProps = {
  notes: DashboardNote[];
};

export const NotesSection = ({ notes }: NotesSectionProps) => {
  if (notes.length === 0) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack spacing={1}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Recent Notes
          </Typography>
          <Stack>
            {notes.map((note) => (
              <CoachNoteItem key={note.id} note={note} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
