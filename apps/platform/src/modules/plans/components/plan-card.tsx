"use client";

import { useState } from "react";

import {
  ArchiveRounded,
  ContentCopyRounded,
  DeleteRounded,
  EditRounded,
  MoreVertRounded,
  PlayArrowRounded,
  RestoreRounded,
} from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import type { TrainingPlanListItem } from "@repo/contracts/training-plan";

import { PlanStatusBadge } from "./plan-status-badge";

type PlanCardProps = {
  plan: TrainingPlanListItem;
  onActivate: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

const formatRelativeTime = (date: Date | string | null): string => {
  if (!date) {
    return "never";
  }

  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  }

  if (diffDay > 0) {
    return `${diffDay}d ago`;
  }

  if (diffHour > 0) {
    return `${diffHour}h ago`;
  }

  if (diffMin > 0) {
    return `${diffMin}m ago`;
  }

  return "just now";
};

const buildStats = (plan: TrainingPlanListItem): string => {
  const parts: string[] = [];

  parts.push(`${plan.workoutsCount} workout${plan.workoutsCount !== 1 ? "s" : ""}`);
  parts.push(`${plan.enrolledAthletesCount} athlete${plan.enrolledAthletesCount !== 1 ? "s" : ""}`);
  parts.push(formatRelativeTime(plan.lastActivityAt));

  return parts.join(" \u00B7 ");
};

export const PlanCard = ({
  plan,
  onActivate,
  onArchive,
  onRestore,
  onDuplicate,
  onDelete,
}: PlanCardProps) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleAction = (action: () => void) => {
    handleMenuClose();
    action();
  };

  return (
    <Card variant="outlined">
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <CardActionArea
          onClick={() => router.push(`/coach/plans/${plan.id}`)}
          sx={{ p: 2, flexGrow: 1 }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
                {plan.name}
              </Typography>
              <PlanStatusBadge status={plan.status} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {buildStats(plan)}
            </Typography>
          </Stack>
        </CardActionArea>

        <IconButton onClick={handleMenuOpen} sx={{ mr: 1 }}>
          <MoreVertRounded />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {plan.status === "DRAFT" && (
            <MenuItem onClick={() => handleAction(() => onActivate(plan.id))}>
              <ListItemIcon>
                <PlayArrowRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>
          )}

          {plan.status === "ACTIVE" && (
            <MenuItem onClick={() => handleAction(() => onArchive(plan.id))}>
              <ListItemIcon>
                <ArchiveRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText>Archive</ListItemText>
            </MenuItem>
          )}

          {plan.status === "ARCHIVED" && (
            <MenuItem onClick={() => handleAction(() => onRestore(plan.id))}>
              <ListItemIcon>
                <RestoreRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText>Restore</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => router.push(`/coach/plans/${plan.id}`)}>
            <ListItemIcon>
              <EditRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction(() => onDuplicate(plan.id))}>
            <ListItemIcon>
              <ContentCopyRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>

          {plan.status !== "ACTIVE" && (
            <MenuItem
              onClick={() => handleAction(() => onDelete(plan.id))}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <DeleteRounded fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Stack>
    </Card>
  );
};
