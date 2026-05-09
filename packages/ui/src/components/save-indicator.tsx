"use client";

import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Button, Chip, CircularProgress, Stack } from "@mui/material";

import type { SaveIndicatorStatus } from "./save-indicator.types";

const SAVING_SPINNER_SIZE = 14;
const DEFAULT_ERROR_LABEL = "Save failed";

export type SaveIndicatorProps = {
  status: SaveIndicatorStatus;
  onRetry?: () => void;
  errorMessage?: string;
};

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status, onRetry, errorMessage }) => {
  if (status === "clean") {
    return null;
  }

  if (status === "dirty") {
    return (
      <Chip
        size="small"
        color="warning"
        variant="outlined"
        icon={<EditIcon fontSize="small" />}
        label="Unsaved changes"
      />
    );
  }

  if (status === "saving") {
    return (
      <Chip
        size="small"
        color="primary"
        variant="outlined"
        icon={<CircularProgress size={SAVING_SPINNER_SIZE} color="inherit" />}
        label="Saving..."
      />
    );
  }

  if (status === "saved") {
    return (
      <Chip size="small" color="success" icon={<CheckIcon fontSize="small" />} label="Saved" />
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip
        size="small"
        color="error"
        icon={<ErrorOutlineIcon fontSize="small" />}
        label={errorMessage ?? DEFAULT_ERROR_LABEL}
      />

      {onRetry && (
        <Button size="small" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Stack>
  );
};
