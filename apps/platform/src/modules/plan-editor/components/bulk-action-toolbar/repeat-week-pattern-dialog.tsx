"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { useTouchTargetSx } from "../plan-canvas/use-touch-target-sx";

import { buildRepeatWeekPatternOps } from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type RepeatWeekPatternDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  planData: GetPlanStructureResponse | undefined;
};

const parseRange = (raw: string): { from: number; to: number } | null => {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const [fromRaw, toRaw] = trimmed.split("-").map((part) => part.trim());
  const from = Number(fromRaw);
  const to = Number(toRaw ?? fromRaw);

  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    return null;
  }

  return { from, to };
};

export const RepeatWeekPatternDialog = ({
  open,
  onClose,
  planId,
  planData,
}: RepeatWeekPatternDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: "Pattern repeated",
  });
  const touchTargetSx = useTouchTargetSx();

  const [sourceText, setSourceText] = useState("");
  const [destinationText, setDestinationText] = useState("");

  useEffect(() => {
    if (!open) {
      setSourceText("");
      setDestinationText("");
    }
  }, [open]);

  const sourceRange = useMemo(() => parseRange(sourceText), [sourceText]);
  const destinationRange = useMemo(() => parseRange(destinationText), [destinationText]);

  const result = useMemo(() => {
    if (!sourceRange || !destinationRange || !planData) {
      return { chunks: [] as const, warnings: [] as readonly string[] };
    }

    const sourceWeeks = planData.plan.weeks.filter(
      (week) => week.index + 1 >= sourceRange.from && week.index + 1 <= sourceRange.to,
    );
    const destinationWeeks = planData.plan.weeks.filter(
      (week) => week.index + 1 >= destinationRange.from && week.index + 1 <= destinationRange.to,
    );

    return buildRepeatWeekPatternOps({ sourceWeeks, destinationWeeks });
  }, [destinationRange, planData, sourceRange]);

  const handleConfirm = async () => {
    if (result.chunks.length === 0) {
      onClose();

      return;
    }

    const ok = await runner.run(result.chunks);

    if (ok) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Repeat week pattern</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Copies blocks from the source week range into the destination range. Source loops if the
            destination is longer. Only block shells are cloned (see clone-day for details).
          </Alert>

          <TextField
            label="Source weeks"
            placeholder="e.g. 1-2"
            helperText="One-based, inclusive (1-2 means weeks 1 and 2)."
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            size="small"
          />
          <TextField
            label="Destination weeks"
            placeholder="e.g. 3-4"
            helperText="One-based, inclusive."
            value={destinationText}
            onChange={(event) => setDestinationText(event.target.value)}
            size="small"
          />

          {result.warnings.map((warning) => (
            <Alert key={warning} severity="warning">
              {warning}
            </Alert>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={touchTargetSx}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={
            runner.state.running || result.chunks.length === 0 || !sourceRange || !destinationRange
          }
          sx={touchTargetSx}
        >
          {runner.state.running
            ? `Saving (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : "Repeat pattern"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
