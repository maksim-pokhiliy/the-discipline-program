"use client";

import CloseIcon from "@mui/icons-material/Close";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ForumIcon from "@mui/icons-material/Forum";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";

export type AthleteBatchAction = "message" | "movePlan" | "pause" | "resume" | "note" | "remove";

const BOTTOM_OFFSET = 96;
const MAX_WIDTH = 1200;
const SIDE_GUTTER = 16;

const ACTIONS: { action: AthleteBatchAction; label: string; icon: React.ReactElement }[] = [
  { action: "message", label: "Message", icon: <ForumIcon fontSize="small" /> },
  { action: "movePlan", label: "Move to plan", icon: <EventNoteIcon fontSize="small" /> },
  { action: "pause", label: "Pause", icon: <PauseIcon fontSize="small" /> },
  { action: "resume", label: "Resume", icon: <PlayArrowIcon fontSize="small" /> },
  { action: "note", label: "Add note", icon: <NoteAddIcon fontSize="small" /> },
  { action: "remove", label: "Remove", icon: <RemoveCircleOutlineIcon fontSize="small" /> },
];

type AthletesBatchBarProps = {
  count: number;
  onAction: (action: AthleteBatchAction) => void;
  onCancel: () => void;
};

export const AthletesBatchBar: React.FC<AthletesBatchBarProps> = ({
  count,
  onAction,
  onCancel,
}) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      position: "fixed",
      bottom: `calc(${BOTTOM_OFFSET}px + env(safe-area-inset-bottom))`,
      left: "50%",
      transform: "translateX(-50%)",
      width: `calc(100% - ${SIDE_GUTTER * 2}px)`,
      maxWidth: MAX_WIDTH,
      zIndex: theme.zIndex.appBar,
      p: 1.25,
      bgcolor: "background.default",
      borderColor: "dividerStrong",
    })}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
        <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
          {count}
        </Box>{" "}
        selected
      </Typography>

      <Divider orientation="vertical" flexItem />

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
        {ACTIONS.map((item) => (
          <Button
            key={item.action}
            size="small"
            variant="text"
            startIcon={item.icon}
            onClick={() => onAction(item.action)}
            {...(item.action === "remove" && { color: "error" as const })}
          >
            {item.label}
          </Button>
        ))}
      </Stack>

      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<CloseIcon />}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Stack>
  </Paper>
);
