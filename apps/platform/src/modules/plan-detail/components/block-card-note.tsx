"use client";

import { Stack, alpha } from "@mui/material";

import { BLOCK_CONSTANTS } from "@repo/contracts/lms/block";

import { NotesListField } from "./notes-list-field";

const NOTES_PLACEHOLDER = "block notes — coaching cues, intent…";
const NOTES_ARIA = "Block notes";
const NOTE_BG_ALPHA = 0.015;

type BlockCardNoteProps = {
  notes: string[] | null;
  onCommit: (next: string[] | null) => void;
};

export const BlockCardNote: React.FC<BlockCardNoteProps> = ({ notes, onCommit }) => (
  <Stack
    direction="row"
    alignItems="center"
    sx={(theme) => ({
      px: theme.spacing(1.75),
      py: theme.spacing(1),
      bgcolor: alpha(theme.palette.common.white, NOTE_BG_ALPHA),
      borderBottom: 1,
      borderColor: "divider",
    })}
  >
    <NotesListField
      value={notes}
      onCommit={onCommit}
      placeholder={NOTES_PLACEHOLDER}
      ariaLabel={NOTES_ARIA}
      maxLength={BLOCK_CONSTANTS.MAX_NOTES_LENGTH}
      addable={false}
    />
  </Stack>
);
