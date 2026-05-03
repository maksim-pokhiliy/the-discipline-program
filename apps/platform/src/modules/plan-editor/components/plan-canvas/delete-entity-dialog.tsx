"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { type NestedEntityCounts, isContainerEmpty } from "./count-nested-entities";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type DeleteEntityKind = "week" | "day" | "session";

export type DeleteEntityDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityKind: DeleteEntityKind;
  entityLabel: string;
  counts: NestedEntityCounts;
  isPending: boolean;
};

const formatTitle = (entityKind: DeleteEntityKind, entityLabel: string): string => {
  if (entityKind === "week") {
    return `Delete week ${entityLabel}?`;
  }

  if (entityKind === "day") {
    return `Delete day ${entityLabel}?`;
  }

  return entityLabel.length > 0 ? `Delete session ${entityLabel}?` : "Delete session?";
};

const formatCountFragments = (counts: NestedEntityCounts): string[] => {
  const fragments: string[] = [];

  if (typeof counts.sessions === "number" && counts.sessions > 0) {
    fragments.push(
      `${counts.sessions.toString()} ${counts.sessions === 1 ? "session" : "sessions"}`,
    );
  }

  if (typeof counts.blocks === "number" && counts.blocks > 0) {
    fragments.push(`${counts.blocks.toString()} ${counts.blocks === 1 ? "block" : "blocks"}`);
  }

  return fragments;
};

const joinFragments = (fragments: string[]): string => {
  if (fragments.length === 0) {
    return "";
  }

  if (fragments.length === 1) {
    return fragments[0] ?? "";
  }

  if (fragments.length === 2) {
    return `${fragments[0] ?? ""} and ${fragments[1] ?? ""}`;
  }

  const head = fragments.slice(0, -1).join(", ");
  const tail = fragments[fragments.length - 1] ?? "";

  return `${head}, and ${tail}`;
};

export const DeleteEntityDialog = ({
  isOpen,
  onClose,
  onConfirm,
  entityKind,
  entityLabel,
  counts,
  isPending,
}: DeleteEntityDialogProps) => {
  const touchTargetSx = useTouchTargetSx();
  const isEmpty = isContainerEmpty(counts);
  const title = formatTitle(entityKind, entityLabel);
  const fragments = formatCountFragments(counts);
  const summary = joinFragments(fragments);

  return (
    <Dialog open={isOpen} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {isEmpty ? (
            <Typography variant="body2">
              This empty {entityKind} will be removed. You can undo this with ⌘Z.
            </Typography>
          ) : (
            <>
              <Typography variant="body2">
                This {entityKind} contains {summary}.
              </Typography>
              <Alert severity="error">
                This permanently deletes the selected {entityKind}. This cannot be undone (the
                editor undo stack does not cover bulk deletes).
              </Alert>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending} sx={touchTargetSx}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isPending}
          sx={touchTargetSx}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
