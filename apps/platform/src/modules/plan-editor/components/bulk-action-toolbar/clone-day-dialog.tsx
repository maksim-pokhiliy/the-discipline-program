"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import {
  type GetPlanStructureResponse,
  type PlanStructureDay,
} from "@repo/contracts/lms/training-plan";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { useTouchTargetSx } from "../plan-canvas/use-touch-target-sx";

import { buildCloneDayOps, type CloneDayTarget } from "./op-builders";
import { useBulkOpRunner } from "./use-bulk-op-runner";

export type CloneDayDialogProps = {
  open: boolean;
  onClose: () => void;
  planId: string;
  planData: GetPlanStructureResponse | undefined;
};

type DayChoice = {
  id: string;
  label: string;
  weekIndex: number;
  day: PlanStructureDay;
};

const collectDays = (data: GetPlanStructureResponse | undefined): DayChoice[] => {
  if (!data) {
    return [];
  }

  const result: DayChoice[] = [];

  for (const week of data.plan.weeks) {
    for (const day of week.days) {
      result.push({
        id: day.id,
        label: `Week ${(week.index + 1).toString()} · ${day.dayOfWeek}`,
        weekIndex: week.index,
        day,
      });
    }
  }

  return result;
};

export const CloneDayDialog = ({ open, onClose, planId, planData }: CloneDayDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const runner = useBulkOpRunner({
    mutateAsync: bulkPatch.mutateAsync,
    successMessage: "Day cloned",
  });
  const touchTargetSx = useTouchTargetSx();

  const days = useMemo(() => collectDays(planData), [planData]);
  const [sourceId, setSourceId] = useState<string>("");
  const [targetIds, setTargetIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSourceId("");
      setTargetIds([]);
    }
  }, [open]);

  const source = days.find((d) => d.id === sourceId)?.day ?? null;

  const targets: CloneDayTarget[] = useMemo(() => {
    return days
      .filter((day) => targetIds.includes(day.id))
      .map((day) => ({ dayId: day.id, sessions: day.day.sessions }));
  }, [days, targetIds]);

  const result = useMemo(() => {
    if (!source) {
      return { chunks: [] as const, warnings: [] as readonly string[] };
    }

    return buildCloneDayOps({ source, targets });
  }, [source, targets]);

  const handleToggleTarget = (id: string) => {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  const handleConfirm = async () => {
    if (!source || targets.length === 0 || result.chunks.length === 0) {
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
      <DialogTitle>Clone day</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Clones the selected source day into target days. Only block shells are copied —
            segments, set groups and entries cannot be created via the bulk-patch API. Use templates
            to instantiate full sessions.
          </Alert>

          <FormControl fullWidth size="small">
            <InputLabel id="clone-day-source-label">Source day</InputLabel>
            <Select
              labelId="clone-day-source-label"
              label="Source day"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
            >
              {days.map((day) => (
                <MenuItem key={day.id} value={day.id}>
                  {day.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2">Target days</Typography>
          <List dense disablePadding>
            {days
              .filter((day) => day.id !== sourceId)
              .map((day) => (
                <ListItem key={day.id} disableGutters>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={targetIds.includes(day.id)}
                        onChange={() => handleToggleTarget(day.id)}
                      />
                    }
                    label={<ListItemText primary={day.label} />}
                  />
                </ListItem>
              ))}
          </List>

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
            runner.state.running || !source || targets.length === 0 || result.chunks.length === 0
          }
          sx={touchTargetSx}
        >
          {runner.state.running
            ? `Cloning (${runner.state.completedChunks.toString()}/${runner.state.totalChunks.toString()})`
            : `Clone into ${targets.length.toString()} day(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
