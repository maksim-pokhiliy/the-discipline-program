"use client";

import { type MouseEvent, useState } from "react";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseIcon from "@mui/icons-material/Pause";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { EnrollmentStatus, type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";
import { formatCalendarDate } from "@repo/shared";
import { ConfirmationModal, UserChip } from "@repo/ui";

import { EnrollmentStatusChip } from "./enrollment-status-chip";

const KEBAB_ARIA = "Enrollment actions";
const HIDE_HISTORY_TOOLTIP = "Plan history before the boarding date is hidden from the athlete";
const REMOVE_CONFIRM_TEXT = "Remove";
const HIDE_ICON_FONT_SIZE = "inherit";
const META_SEPARATOR = " · ";

type EnrollmentRowProps = {
  enrollment: PlanEnrollment;
  athlete: CoachAthleteListItem | undefined;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
  isMutating: boolean;
};

export const EnrollmentRow: React.FC<EnrollmentRowProps> = ({
  enrollment,
  athlete,
  onPause,
  onResume,
  onRemove,
  isMutating,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const isMenuOpen = Boolean(anchorEl);
  const isActive = enrollment.status === EnrollmentStatus.ACTIVE;
  const isPaused = enrollment.status === EnrollmentStatus.PAUSED;

  const displayName = athlete?.name?.trim() || athlete?.email?.trim() || "this athlete";

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePause = () => {
    setAnchorEl(null);
    onPause();
  };

  const handleResume = () => {
    setAnchorEl(null);
    onResume();
  };

  const handleRemoveRequest = () => {
    setAnchorEl(null);
    setIsConfirmOpen(true);
  };

  const handleRemoveConfirm = () => {
    onRemove();
    setIsConfirmOpen(false);
  };

  const secondary = (
    <Typography variant="caption" color="text.secondary" component="span">
      Boarded {formatCalendarDate(enrollment.boardedAt, "day")}
      {enrollment.hidePastBeforeBoarding ? (
        <Tooltip title={HIDE_HISTORY_TOOLTIP} arrow>
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            {META_SEPARATOR}
            <VisibilityOffIcon fontSize={HIDE_ICON_FONT_SIZE} />
            hides history
          </Box>
        </Tooltip>
      ) : null}
    </Typography>
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ py: 1, px: 1.5, minWidth: 0 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <UserChip
          size="small"
          user={
            athlete
              ? {
                  id: athlete.userId,
                  name: athlete.name,
                  email: athlete.email,
                  image: athlete.image,
                }
              : null
          }
          secondary={secondary}
        />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1}>
        <EnrollmentStatusChip status={enrollment.status} />

        {isActive ? (
          <Button
            variant="text"
            size="small"
            startIcon={<PauseIcon fontSize="small" />}
            disabled={isMutating}
            onClick={onPause}
          >
            Pause
          </Button>
        ) : null}

        {isPaused ? (
          <Button
            variant="text"
            size="small"
            startIcon={<PlayArrowIcon fontSize="small" />}
            disabled={isMutating}
            onClick={onResume}
          >
            Resume
          </Button>
        ) : null}

        <IconButton size="small" aria-label={KEBAB_ARIA} onClick={handleMenuOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
          {isActive ? (
            <MenuItem onClick={handlePause} disabled={isMutating}>
              <ListItemIcon>
                <PauseIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Pause</ListItemText>
            </MenuItem>
          ) : null}

          {isPaused ? (
            <MenuItem onClick={handleResume} disabled={isMutating}>
              <ListItemIcon>
                <PlayArrowIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Resume</ListItemText>
            </MenuItem>
          ) : null}

          <MenuItem
            onClick={handleRemoveRequest}
            disabled={isMutating}
            sx={{ color: "error.main", "& .MuiListItemIcon-root": { color: "error.main" } }}
          >
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Remove from plan</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>

      <ConfirmationModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Remove from plan"
        type="danger"
        message={`Remove ${displayName} from this plan? They keep their history; you can re-enroll them later.`}
        confirmText={REMOVE_CONFIRM_TEXT}
        isConfirming={isMutating}
        onConfirm={handleRemoveConfirm}
      />
    </Stack>
  );
};
