"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import {
  type PlanStructureBlock,
  type PlanStructureDay,
  type PlanStructureSession,
} from "@repo/contracts/lms/training-plan";

import {
  useCreateBlockTemplate,
  useCreateSessionTemplate,
  useCreateWeekTemplate,
} from "@app/lib/hooks";

import {
  buildBlockTemplatePayload,
  buildSessionTemplatePayload,
  buildWeekTemplatePayload,
  type WeekSnapshotForTemplate,
} from "./save-template-payload";

export type SaveTemplateScope = "block" | "session" | "week";

type SaveTemplateSource =
  | { scope: "block"; block: PlanStructureBlock }
  | { scope: "session"; session: PlanStructureSession }
  | { scope: "week"; week: WeekSnapshotForTemplate; day: PlanStructureDay };

export type SaveTemplateDialogProps = {
  open: boolean;
  source: SaveTemplateSource | null;
  onClose: () => void;
};

const SCOPE_OPTIONS = [
  { value: "COACH", label: "Coach (mine)" },
  { value: "SYSTEM", label: "System (global)" },
] as const;

export const SaveTemplateDialog = ({ open, source, onClose }: SaveTemplateDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"COACH" | "SYSTEM">("COACH");
  const [submitted, setSubmitted] = useState(false);

  const createBlockTemplate = useCreateBlockTemplate();
  const createSessionTemplate = useCreateSessionTemplate();
  const createWeekTemplate = useCreateWeekTemplate();

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setScope("COACH");
      setSubmitted(false);
    }
  }, [open]);

  if (!source) {
    return null;
  }

  const isPending =
    createBlockTemplate.isPending ||
    createSessionTemplate.isPending ||
    createWeekTemplate.isPending;

  const handleSubmit = () => {
    setSubmitted(true);

    if (name.trim().length === 0) {
      return;
    }

    const baseInput = {
      name: name.trim(),
      description: description.trim().length > 0 ? description.trim() : undefined,
      scope,
    };

    if (source.scope === "block") {
      createBlockTemplate.mutate(
        { ...baseInput, payload: buildBlockTemplatePayload(source.block) },
        { onSuccess: onClose },
      );

      return;
    }

    if (source.scope === "session") {
      createSessionTemplate.mutate(
        { ...baseInput, payload: buildSessionTemplatePayload(source.session) },
        { onSuccess: onClose },
      );

      return;
    }

    createWeekTemplate.mutate(
      { ...baseInput, payload: buildWeekTemplatePayload(source.week) },
      { onSuccess: onClose },
    );
  };

  const titleByScope: Record<SaveTemplateScope, string> = {
    block: "Save block as template",
    session: "Save session as template",
    week: "Save week as template",
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{titleByScope[source.scope]}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert severity="info">
            The current {source.scope} tree will be captured as a snapshot. Future edits to the
            source plan will not propagate to the template.
          </Alert>

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            disabled={isPending}
            error={submitted && name.trim().length === 0}
            helperText={submitted && name.trim().length === 0 ? "Name is required" : undefined}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={isPending}
          />

          <TextField
            label="Visibility"
            select
            value={scope}
            onChange={(e) => setScope(e.target.value === "SYSTEM" ? "SYSTEM" : "COACH")}
            fullWidth
            disabled={isPending}
            helperText="COACH templates are private to you. SYSTEM is global (admin-only)."
          >
            {SCOPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
        >
          {isPending ? "Saving..." : "Save template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
