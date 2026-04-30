"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch, useExercisesPageData } from "@app/lib/hooks";

import { type PlanSelection } from "../plan-canvas";

import { buildBulkReplaceOps, collectReplaceTargets, countOps } from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type BulkReplaceDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  selection: PlanSelection;
  planData: GetPlanStructureResponse | undefined;
};

export const BulkReplaceDialog = ({
  open,
  onClose,
  planId,
  selection,
  planData,
}: BulkReplaceDialogProps) => {
  const [replacement, setReplacement] = useState<ExerciseLibraryItem | null>(null);
  const exercises = useExercisesPageData({ scope: "ALL", take: 200 });
  const bulkPatch = usePlanBulkPatch(planId);
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: "Entries replaced",
  });

  const targets = useMemo(() => {
    if (selection.kind !== "entry") {
      return [];
    }

    return collectReplaceTargets(planData, selection.ids);
  }, [planData, selection]);

  const previewItems = useMemo(() => {
    return targets.map((target) => {
      const entry = target.segment.setGroups
        .flatMap((sg) => sg.entries)
        .find((e) => e.id === target.entryId);

      return {
        entryId: target.entryId,
        exerciseName: entry?.exerciseSnapshot.name ?? "Entry",
      };
    });
  }, [targets]);

  const handleConfirm = async () => {
    if (!replacement) {
      return;
    }

    const result = buildBulkReplaceOps({ targets, replacement });
    const total = countOps(result);

    if (total === 0) {
      return;
    }

    const ok = await runner.run(result);

    if (ok) {
      onClose();
    }
  };

  if (selection.kind !== "entry") {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Replace selected entries</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Replaces the exercise on every selected entry. Prescriptions, notes and ordering stay
            the same.
          </Alert>

          <Typography variant="subtitle2">Selected entries ({previewItems.length})</Typography>
          <List dense disablePadding>
            {previewItems.map((item) => (
              <ListItem key={item.entryId} disableGutters>
                <ListItemText primary={item.exerciseName} />
              </ListItem>
            ))}
          </List>

          <Autocomplete<ExerciseLibraryItem>
            options={exercises.data?.items ?? []}
            getOptionLabel={(option) => option.name}
            value={replacement}
            onChange={(_, value) => setReplacement(value)}
            renderInput={(params) => (
              <TextField {...params} label="Replacement exercise" placeholder="Search…" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={!replacement || runner.state.running || previewItems.length === 0}
        >
          {runner.state.running
            ? `Saving (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : "Apply replacement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
