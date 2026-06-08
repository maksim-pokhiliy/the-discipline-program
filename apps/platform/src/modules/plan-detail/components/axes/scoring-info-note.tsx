"use client";

import Info from "@mui/icons-material/Info";
import { Stack, Typography } from "@mui/material";

const NOTE_SUFFIX = "recorded as data — not yet computed (scoring engine lands later).";
const NOTE_SEPARATOR = " · ";
const ICON_FONT_SIZE_PX = 14;
const NOTE_GAP = 0.75;

type ScoringInfoNoteProps = {
  note?: string | undefined;
};

export const ScoringInfoNote: React.FC<ScoringInfoNoteProps> = ({ note }) => (
  <Stack direction="row" spacing={NOTE_GAP} sx={{ alignItems: "center" }}>
    <Info sx={{ fontSize: ICON_FONT_SIZE_PX, color: "text.faint" }} />

    <Typography variant="caption" color="text.faint">
      {note !== undefined ? `${note}${NOTE_SEPARATOR}` : ""}
      {NOTE_SUFFIX}
    </Typography>
  </Stack>
);
