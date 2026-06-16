"use client";

import { type MouseEvent, useState } from "react";

import EventNoteIcon from "@mui/icons-material/EventNote";
import ForumIcon from "@mui/icons-material/Forum";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

export type AthleteRowAction =
  | "open"
  | "message"
  | "movePlan"
  | "pause"
  | "resume"
  | "note"
  | "remove";

type AthleteRowActionsMenuProps = {
  onAction: (action: AthleteRowAction) => void;
};

const ITEMS: { action: AthleteRowAction; label: string; icon: React.ReactElement }[] = [
  { action: "open", label: "Open athlete", icon: <OpenInNewIcon fontSize="small" /> },
  { action: "message", label: "Message on Telegram", icon: <ForumIcon fontSize="small" /> },
  { action: "movePlan", label: "Move to plan…", icon: <EventNoteIcon fontSize="small" /> },
  { action: "pause", label: "Pause enrollment", icon: <PauseIcon fontSize="small" /> },
  { action: "resume", label: "Resume enrollment", icon: <PlayArrowIcon fontSize="small" /> },
  { action: "note", label: "Add coach note", icon: <NoteAddIcon fontSize="small" /> },
];

export const AthleteRowActionsMenu: React.FC<AthleteRowActionsMenuProps> = ({ onAction }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handlePick = (event: MouseEvent<HTMLElement>, action: AthleteRowAction) => {
    event.stopPropagation();
    setAnchorEl(null);
    onAction(action);
  };

  return (
    <>
      <IconButton size="small" aria-label="Athlete actions" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        {ITEMS.map((item) => (
          <MenuItem key={item.action} onClick={(event) => handlePick(event, item.action)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          onClick={(event) => handlePick(event, "remove")}
          sx={{ color: "error.main", "& .MuiListItemIcon-root": { color: "error.main" } }}
        >
          <ListItemIcon>
            <RemoveCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove from plan</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
