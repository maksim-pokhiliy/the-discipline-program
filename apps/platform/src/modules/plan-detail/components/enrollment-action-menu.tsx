"use client";

import { useRef, useState } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { ConfirmationModal } from "@repo/ui";

type EnrollmentActionMenuProps = {
  enrollmentId: string;
  status: PlanEnrollmentStatus;
  athleteName: string;
  onUpdate: (id: string, status: PlanEnrollmentStatus) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
};

export const EnrollmentActionMenu: React.FC<EnrollmentActionMenuProps> = ({
  enrollmentId,
  status,
  athleteName,
  onUpdate,
  onDelete,
  isPending,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
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
        size="small"
        onClick={() => setMenuOpen(true)}
        disabled={isPending}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={close}>
        {status === PlanEnrollmentStatus.ACTIVE && (
          <MenuItem
            onClick={handle(() => onUpdate(enrollmentId, PlanEnrollmentStatus.PAUSED))}
            disabled={isPending}
          >
            <ListItemIcon>
              <PauseIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pause</ListItemText>
          </MenuItem>
        )}

        {status === PlanEnrollmentStatus.PAUSED && (
          <MenuItem
            onClick={handle(() => onUpdate(enrollmentId, PlanEnrollmentStatus.ACTIVE))}
            disabled={isPending}
          >
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resume</ListItemText>
          </MenuItem>
        )}

        {status !== PlanEnrollmentStatus.COMPLETED && (
          <MenuItem
            onClick={handle(() => onUpdate(enrollmentId, PlanEnrollmentStatus.COMPLETED))}
            disabled={isPending}
          >
            <ListItemIcon>
              <DoneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Complete</ListItemText>
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
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Remove Enrollment"
        type="danger"
        message={`Remove ${athleteName} from this plan?`}
        details="The athlete will lose access to this plan's workouts."
        isConfirming={isPending}
        onConfirm={() => onDelete(enrollmentId)}
      />
    </>
  );
};
