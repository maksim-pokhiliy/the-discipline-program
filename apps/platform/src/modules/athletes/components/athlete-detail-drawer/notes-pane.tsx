"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack, TextField, Typography } from "@mui/material";

import type { CoachAthleteNote } from "@repo/contracts/coaching/coach-athletes";
import { COACH_NOTE_CONSTANTS } from "@repo/contracts/coaching/coach-note";
import { formatTimeAgo } from "@repo/shared";

import { useCreateCoachNote } from "@app/lib/hooks";

const NOTE_FIELD_LABEL = "Add a private coach note";
const NOTE_ROWS = 3;
const EMPTY_DRAFT = "";
const NO_NOTES_LABEL = "No notes yet.";

type NotesPaneProps = {
  athleteId: string;
  notes: CoachAthleteNote[];
};

export const NotesPane: React.FC<NotesPaneProps> = ({ athleteId, notes }) => {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const createNote = useCreateCoachNote();

  const trimmedDraft = draft.trim();
  const canSubmit = trimmedDraft.length > 0 && !createNote.isPending;

  const handleAdd = (): void => {
    if (!canSubmit) {
      return;
    }

    createNote.mutate(
      { athleteId, content: trimmedDraft },
      { onSuccess: () => setDraft(EMPTY_DRAFT) },
    );
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <TextField
          label={NOTE_FIELD_LABEL}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          fullWidth
          multiline
          rows={NOTE_ROWS}
          helperText={`${draft.length}/${COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH}`}
          slotProps={{ htmlInput: { maxLength: COACH_NOTE_CONSTANTS.MAX_CONTENT_LENGTH } }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!canSubmit}
          onClick={handleAdd}
          sx={{ alignSelf: "flex-end" }}
        >
          Add note
        </Button>
      </Stack>

      {notes.length > 0 ? (
        <Stack spacing={1}>
          {notes.map((note) => (
            <Stack
              key={note.id}
              spacing={0.5}
              sx={(theme) => ({
                p: 1.5,
                borderRadius: theme.spacing(0.5),
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.default,
              })}
            >
              <Typography variant="overline" sx={{ color: "text.faint" }}>
                {formatTimeAgo(note.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.primary", whiteSpace: "pre-wrap" }}>
                {note.content}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "text.muted", fontStyle: "italic" }}>
          {NO_NOTES_LABEL}
        </Typography>
      )}
    </Stack>
  );
};
