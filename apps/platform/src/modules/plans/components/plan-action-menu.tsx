"use client";

import { useRef, useState } from "react";

import ArchiveIcon from "@mui/icons-material/Archive";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestoreIcon from "@mui/icons-material/Restore";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import Link from "next/link";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";
import { ConfirmationModal } from "@repo/ui";

type PlanActionMenuProps = {
  planId: string;
  planName: string;
  status: TrainingPlanStatus;
  onActivate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isPending: boolean;
};

export const PlanActionMenu: React.FC<PlanActionMenuProps> = ({
  planId,
  planName,
  status,
  onActivate,
  onArchive,
  onRestore,
  onDuplicate,
  onDelete,
  isPending,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const close = () => setMenuOpen(false);

  const handle = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <>
      <IconButton
        ref={anchorRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(true);
        }}
        disabled={isPending}
        aria-label="Plan actions"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={close}>
        <MenuItem component={Link} href={`/coach/plans/${planId}`} onClick={close}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>

        <MenuItem onClick={handle(onDuplicate)} disabled={isPending}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>

        {status === TrainingPlanStatus.DRAFT && (
          <MenuItem onClick={handle(onActivate)} disabled={isPending}>
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}

        {status === TrainingPlanStatus.ACTIVE && (
          <MenuItem
            onClick={() => {
              close();
              setArchiveOpen(true);
            }}
            disabled={isPending}
          >
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
          </MenuItem>
        )}

        {status === TrainingPlanStatus.ARCHIVED && (
          <MenuItem onClick={handle(onRestore)} disabled={isPending}>
            <ListItemIcon>
              <RestoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restore</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            close();
            setDeleteOpen(true);
          }}
          disabled={isPending}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive Training Plan"
        type="danger"
        message={`Are you sure you want to archive "${planName}"?`}
        details="Archived plans are no longer visible to athletes. You can restore it later."
        isConfirming={isPending}
        onConfirm={onArchive}
      />

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Training Plan"
        type="danger"
        message={`Are you sure you want to delete "${planName}"?`}
        details="This action cannot be undone. All workouts, blocks, and prescribed sets in this plan will be permanently removed."
        isConfirming={isPending}
        onConfirm={onDelete}
      />
    </>
  );
};
