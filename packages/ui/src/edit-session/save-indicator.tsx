"use client";

import { useEffect, useState } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblemOutlined";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Chip, CircularProgress, Stack, Tooltip, Typography } from "@mui/material";

import { type EditSessionStatus } from "./types";

const RELATIVE_REFRESH_MS = 30_000;

const formatRelative = (date: Date | null, now: number): string => {
  if (!date) {
    return "No edits yet";
  }

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (seconds < 5) {
    return "Saved just now";
  }

  if (seconds < 60) {
    return `Saved ${seconds.toString()}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `Saved ${minutes.toString()}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  return `Saved ${hours.toString()}h ago`;
};

export type SaveIndicatorProps = {
  status: EditSessionStatus;
  lastSavedAt?: Date | null;
  conflict?: { currentVersion: number } | null;
  errorMessage?: string;
  validationMessage?: string;
  onRetry?: () => void;
  onReload?: () => void;
};

export const SaveIndicator = ({
  status,
  lastSavedAt = null,
  conflict = null,
  errorMessage,
  validationMessage,
  onRetry,
  onReload,
}: SaveIndicatorProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "idle") {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), RELATIVE_REFRESH_MS);

    return () => clearInterval(interval);
  }, [status]);

  if (status === "idle") {
    return (
      <Chip
        size="small"
        variant="outlined"
        color="default"
        icon={<HistoryToggleOffIcon fontSize="small" />}
        label={formatRelative(lastSavedAt, now)}
      />
    );
  }

  if (status === "dirty") {
    return (
      <Chip
        size="small"
        variant="outlined"
        color="warning"
        icon={<SaveIcon fontSize="small" />}
        label="Unsaved changes — saving in 8s"
      />
    );
  }

  if (status === "dirty-invalid") {
    const tooltipText = validationMessage ?? "Cannot save — fix errors";

    return (
      <Tooltip title={tooltipText} arrow>
        <Chip
          size="small"
          variant="outlined"
          color="error"
          icon={<ReportProblemIcon fontSize="small" />}
          label="Cannot save — fix errors"
        />
      </Tooltip>
    );
  }

  if (status === "saving") {
    return (
      <Chip
        size="small"
        variant="outlined"
        color="info"
        icon={<CircularProgress size={12} thickness={5} />}
        label="Saving…"
      />
    );
  }

  if (status === "saved") {
    return (
      <Chip
        size="small"
        variant="filled"
        color="success"
        icon={<CheckCircleIcon fontSize="small" />}
        label="Saved just now"
      />
    );
  }

  if (status === "error") {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          size="small"
          variant="outlined"
          color="error"
          icon={<ErrorIcon fontSize="small" />}
          label={errorMessage ?? "Save failed"}
        />
        {onRetry ? (
          <Button size="small" variant="text" color="error" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        variant="outlined"
        color="warning"
        icon={<RefreshIcon fontSize="small" />}
        label="Edited in another window"
      />
      {conflict ? (
        <Box>
          <Typography variant="caption" color="text.secondary">
            v{conflict.currentVersion.toString()}
          </Typography>
        </Box>
      ) : null}
      {onReload ? (
        <Button size="small" variant="text" color="warning" onClick={onReload}>
          Reload from server
        </Button>
      ) : null}
    </Stack>
  );
};
