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

import { buildShiftWeeksOps } from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type ShiftWeeksDialogProps = {
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

export const ShiftWeeksDialog = ({ open, onClose, planId, planData }: ShiftWeeksDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: "Weeks shifted",
  });

  const [rangeText, setRangeText] = useState("");
  const [deltaText, setDeltaText] = useState("");

  useEffect(() => {
    if (!open) {
      setRangeText("");
      setDeltaText("");
    }
  }, [open]);

  const range = useMemo(() => parseRange(rangeText), [rangeText]);
  const delta = useMemo(() => {
    const trimmed = deltaText.trim();

    if (!trimmed) {
      return null;
    }

    const value = Number(trimmed);

    return Number.isInteger(value) && value !== 0 ? value : null;
  }, [deltaText]);

  const result = useMemo(() => {
    if (!range || delta === null || !planData) {
      return { chunks: [] as const, warnings: [] as readonly string[] };
    }

    const weeks = planData.plan.weeks.filter(
      (week) => week.index + 1 >= range.from && week.index + 1 <= range.to,
    );

    return buildShiftWeeksOps({
      weeks,
      destinationWeeks: planData.plan.weeks,
      delta,
    });
  }, [delta, planData, range]);

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
      <DialogTitle>Shift weeks</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Moves the blocks of the source range by the given delta. Positive numbers shift later in
            the plan; negative numbers shift earlier. Destination weeks must already exist in the
            plan.
          </Alert>

          <TextField
            label="Source weeks"
            placeholder="e.g. 1-3"
            helperText="One-based, inclusive."
            value={rangeText}
            onChange={(event) => setRangeText(event.target.value)}
            size="small"
          />
          <TextField
            label="Delta"
            placeholder="e.g. 2 or -1"
            helperText="Number of weeks to shift by. Positive = later, negative = earlier."
            value={deltaText}
            onChange={(event) => setDeltaText(event.target.value)}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={runner.state.running || result.chunks.length === 0 || !range || delta === null}
        >
          {runner.state.running
            ? `Saving (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : "Shift weeks"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
