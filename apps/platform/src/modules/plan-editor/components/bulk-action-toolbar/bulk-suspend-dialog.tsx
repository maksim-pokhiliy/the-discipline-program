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

import { findBlockById } from "../inspector/use-selected-entities";
import { type PlanSelection } from "../plan-canvas";

import { buildBulkSuspendOps } from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type BulkSuspendDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  selection: PlanSelection;
  planData: GetPlanStructureResponse | undefined;
  suspended: boolean;
};

export const BulkSuspendDialog = ({
  open,
  onClose,
  planId,
  selection,
  planData,
  suspended,
}: BulkSuspendDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const action = suspended ? "Suspend" : "Reactivate";
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: suspended ? "Blocks suspended" : "Blocks reactivated",
  });

  const blocks = useMemo(() => {
    if (selection.kind !== "block") {
      return [];
    }

    return selection.ids
      .map((id) => findBlockById(planData, id))
      .filter((block): block is NonNullable<typeof block> => block !== null);
  }, [planData, selection]);

  const handleConfirm = async () => {
    const chunks = buildBulkSuspendOps({ blocks, suspended });

    if (chunks.length === 0) {
      onClose();

      return;
    }

    const ok = await runner.run(chunks);

    if (ok) {
      onClose();
    }
  };

  if (selection.kind !== "block") {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {action} {blocks.length.toString()} {blocks.length === 1 ? "block" : "blocks"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity={suspended ? "warning" : "info"}>
            {suspended
              ? "Suspended blocks stay in the plan but show a strikethrough on the athlete view. Reactivate any time."
              : "Reactivates suspended blocks; athletes see them again."}
          </Alert>

          <Typography variant="subtitle2">Affected blocks</Typography>
          <List dense disablePadding>
            {blocks.map((block) => (
              <ListItem key={block.id} disableGutters>
                <ListItemText primary={block.title ?? "Block"} secondary={block.status} />
              </ListItem>
            ))}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color={suspended ? "warning" : "primary"}
          onClick={() => {
            void handleConfirm();
          }}
          disabled={runner.state.running || blocks.length === 0}
        >
          {runner.state.running
            ? `Saving (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : action}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
