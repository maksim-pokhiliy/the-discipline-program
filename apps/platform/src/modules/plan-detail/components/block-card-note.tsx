"use client";

import { Stack, alpha } from "@mui/material";

import { BLOCK_CONSTANTS } from "@repo/contracts/lms/block";
import { InlineEditText } from "@repo/ui";

const NOTES_PLACEHOLDER = "block notes — coaching cues, intent…";
const NOTES_ARIA = "Block notes";
const NOTE_BG_ALPHA = 0.015;

type BlockCardNoteProps = {
  value: string;
  onCommit: (next: string) => void;
};

export const BlockCardNote: React.FC<BlockCardNoteProps> = ({ value, onCommit }) => (
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
    <InlineEditText
      value={value}
      onCommit={onCommit}
      variant="body2"
      multiline
      emptyIsValid
      placeholder={NOTES_PLACEHOLDER}
      maxLength={BLOCK_CONSTANTS.MAX_NOTES_LENGTH}
      ariaLabel={NOTES_ARIA}
      sx={{ flex: 1, minWidth: 0 }}
    />
  </Stack>
);
