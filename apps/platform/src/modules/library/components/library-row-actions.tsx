"use client";

import { useCallback, useState, type MouseEvent } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";

import { UserRole } from "@repo/contracts/iam/auth";

export type LibraryRowActionsProps = {
  role: UserRole | null;
  isOwn: boolean;
  scope: "SYSTEM" | "COACH";
  onEdit?: () => void;
  onDelete?: () => void;
  onPromote?: () => void;
  onDemote?: () => void;
};

export const LibraryRowActions = ({
  role,
  isOwn,
  scope,
  onEdit,
  onDelete,
  onPromote,
  onDemote,
}: LibraryRowActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const isPrivileged = role === UserRole.HEAD_COACH || role === UserRole.ADMIN;
  const canEdit = isPrivileged || isOwn;
  const canDelete = isPrivileged || isOwn;
  const canPromote = isPrivileged && scope === "COACH";
  const canDemote = isPrivileged && scope === "SYSTEM";

  if (!canEdit && !canDelete && !canPromote && !canDemote) {
    return null;
  }

  return (
    <>
      <Tooltip title="Actions">
        <IconButton size="small" onClick={handleOpen} aria-label="Row actions">
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {canEdit && onEdit && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEdit();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {canPromote && onPromote && (
          <MenuItem
            onClick={() => {
              handleClose();
              onPromote();
            }}
          >
            <ListItemIcon>
              <ArrowUpwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Promote to SYSTEM</ListItemText>
          </MenuItem>
        )}

        {canDemote && onDemote && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDemote();
            }}
          >
            <ListItemIcon>
              <ArrowDownwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Demote to COACH</ListItemText>
          </MenuItem>
        )}

        {canDelete && onDelete && (
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
