"use client";

import { useMemo } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { findBlockById, findEntryById, findSegmentById } from "../inspector/use-selected-entities";
import { type PlanSelection } from "../plan-canvas";
import { useTouchTargetSx } from "../plan-canvas/use-touch-target-sx";

import {
  buildBulkDeleteBlockOps,
  buildBulkDeleteEntryOps,
  buildBulkDeleteSegmentOps,
  type BulkOpChunks,
} from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type BulkDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  selection: PlanSelection;
  planData: GetPlanStructureResponse | undefined;
};

type EntityPreview = {
  id: string;
  primary: string;
  secondary?: string;
};

const buildPreview = (
  selection: PlanSelection,
  planData: GetPlanStructureResponse | undefined,
): EntityPreview[] => {
  const items: EntityPreview[] = [];

  for (const id of selection.ids) {
    if (selection.kind === "block") {
      const block = findBlockById(planData, id);

      if (!block) {
        continue;
      }

      items.push({
        id,
        primary: block.title ?? "Block",
        secondary: `${block.segments.length.toString()} segments`,
      });
    } else if (selection.kind === "segment") {
      const found = findSegmentById(planData, id);

      if (!found) {
        continue;
      }

      const total = found.segment.setGroups.reduce((acc, sg) => acc + sg.entries.length, 0);

      items.push({
        id,
        primary: found.segment.label ?? "Segment",
        secondary: `${total.toString()} entries`,
      });
    } else {
      const found = findEntryById(planData, id);

      if (!found) {
        continue;
      }

      items.push({
        id,
        primary: found.entry.exerciseSnapshot.name,
      });
    }
  }

  return items;
};

const buildOps = (
  selection: PlanSelection,
  planData: GetPlanStructureResponse | undefined,
): BulkOpChunks => {
  if (selection.kind === "block") {
    const blocks = selection.ids
      .map((id) => findBlockById(planData, id))
      .filter((block): block is NonNullable<typeof block> => block !== null);

    return buildBulkDeleteBlockOps({ blocks });
  }

  if (selection.kind === "segment") {
    const segments = selection.ids
      .map((id) => findSegmentById(planData, id))
      .filter((found): found is NonNullable<typeof found> => found !== null)
      .map((found) => found.segment);

    return buildBulkDeleteSegmentOps({ segments });
  }

  const entries = selection.ids
    .map((id) => findEntryById(planData, id))
    .filter((found): found is NonNullable<typeof found> => found !== null)
    .map((found) => found.entry);

  return buildBulkDeleteEntryOps({ entries });
};

export const BulkDeleteDialog = ({
  open,
  onClose,
  planId,
  selection,
  planData,
}: BulkDeleteDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: "Selection deleted",
  });
  const touchTargetSx = useTouchTargetSx();

  const items = useMemo(() => buildPreview(selection, planData), [planData, selection]);
  const noun =
    selection.kind === "block"
      ? items.length === 1
        ? "block"
        : "blocks"
      : selection.kind === "segment"
        ? items.length === 1
          ? "segment"
          : "segments"
        : items.length === 1
          ? "entry"
          : "entries";

  const handleConfirm = async () => {
    const chunks = buildOps(selection, planData);

    if (chunks.length === 0) {
      onClose();

      return;
    }

    const ok = await runner.run(chunks);

    if (ok) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Delete {items.length.toString()} {noun}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="error">
            This permanently deletes the selected {noun}. This cannot be undone (the editor undo
            stack does not cover bulk deletes).
          </Alert>

          <Typography variant="subtitle2">Affected items</Typography>
          <List dense disablePadding>
            {items.map((item) => (
              <ListItem key={item.id} disableGutters>
                <ListItemText primary={item.primary} secondary={item.secondary} />
              </ListItem>
            ))}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={touchTargetSx}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={runner.state.running || items.length === 0}
          sx={touchTargetSx}
        >
          {runner.state.running
            ? `Deleting (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : `Delete ${noun}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
