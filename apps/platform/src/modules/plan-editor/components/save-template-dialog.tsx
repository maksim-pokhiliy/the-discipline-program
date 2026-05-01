"use client";

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
  Tab,
  Tabs,
  TextField,
} from "@mui/material";

import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
} from "@repo/contracts/lms/training-plan";

import {
  SCOPE_TABS,
  type SaveTemplateScope,
  type SessionOption,
  type WeekOption,
  titleByScope,
} from "./save-template-dialog-helpers";
import { useSaveTemplateDialog } from "./use-save-template-dialog";

export type { SaveTemplateScope } from "./save-template-dialog-helpers";

export type SaveTemplateDialogProps = {
  open: boolean;
  onClose: () => void;
  planStructure: GetPlanStructureResponse | undefined;
  selectedBlock: PlanStructureBlock | null;
  initialScope?: SaveTemplateScope | undefined;
};

const renderSessionField = (
  options: ReadonlyArray<SessionOption>,
  value: string,
  onChange: (next: string) => void,
  disabled: boolean,
  inferred: boolean,
) => {
  if (options.length === 0) {
    return (
      <Alert severity="warning">No sessions available in this plan. Create a session first.</Alert>
    );
  }

  return (
    <TextField
      label="Session"
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      disabled={disabled}
      helperText={
        inferred
          ? "Auto-detected from the selected block. Pick another session if needed."
          : "Pick the session to capture as a template."
      }
    >
      {options.map((opt) => (
        <MenuItem key={opt.id} value={opt.id}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

const renderWeekField = (
  options: ReadonlyArray<WeekOption>,
  value: string,
  onChange: (next: string) => void,
  disabled: boolean,
  inferred: boolean,
) => {
  if (options.length === 0) {
    return <Alert severity="warning">No weeks available in this plan. Create a week first.</Alert>;
  }

  return (
    <TextField
      label="Week"
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      disabled={disabled}
      helperText={
        inferred
          ? "Auto-detected from the selected block. Pick another week if needed."
          : "Pick the week to capture as a template."
      }
    >
      {options.map((opt) => (
        <MenuItem key={opt.id} value={opt.id}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export const SaveTemplateDialog = ({
  open,
  onClose,
  planStructure,
  selectedBlock,
  initialScope,
}: SaveTemplateDialogProps) => {
  const ctl = useSaveTemplateDialog({
    open,
    onClose,
    planStructure,
    selectedBlock,
    initialScope,
  });

  return (
    <Dialog open={open} onClose={ctl.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{titleByScope[ctl.scopeTab]}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Tabs
            value={ctl.scopeTab}
            onChange={(_, value: SaveTemplateScope) => ctl.setScopeTab(value)}
            variant="fullWidth"
          >
            {SCOPE_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} disabled={ctl.isPending} />
            ))}
          </Tabs>

          <Alert severity="info">
            The current {ctl.scopeTab} tree will be captured as a snapshot. Future edits to the
            source plan will not propagate to the template.
          </Alert>

          {ctl.scopeTab === "block" && ctl.blockMissing && (
            <Alert severity="warning">
              Select a block (or a segment inside a block) on the canvas before saving as a block
              template.
            </Alert>
          )}

          {ctl.scopeTab === "session" &&
            renderSessionField(
              ctl.sessionOptions,
              ctl.sessionId,
              ctl.setSessionId,
              ctl.isPending,
              ctl.inferredSession,
            )}

          {ctl.scopeTab === "week" &&
            renderWeekField(
              ctl.weekOptions,
              ctl.weekId,
              ctl.setWeekId,
              ctl.isPending,
              ctl.inferredWeek,
            )}

          <TextField
            label="Name"
            value={ctl.name}
            onChange={(e) => ctl.setName(e.target.value)}
            fullWidth
            required
            disabled={ctl.isPending}
            error={ctl.submitted && ctl.name.trim().length === 0}
            helperText={
              ctl.submitted && ctl.name.trim().length === 0 ? "Name is required" : undefined
            }
          />

          <TextField
            label="Description"
            value={ctl.description}
            onChange={(e) => ctl.setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={ctl.isPending}
          />

          <TextField
            label="Visibility"
            select
            value={ctl.scope}
            onChange={(e) => ctl.setScope(e.target.value === "SYSTEM" ? "SYSTEM" : "COACH")}
            fullWidth
            disabled={ctl.isPending || !ctl.isPrivileged}
            helperText={
              ctl.isPrivileged
                ? "COACH templates are private to you. SYSTEM is global (admin-only)."
                : "Coaches can save templates as COACH (private). SYSTEM scope is admin-only."
            }
          >
            {ctl.scopeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={ctl.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={ctl.submit}
          disabled={ctl.isPending || ctl.blockMissing || ctl.sessionMissing || ctl.weekMissing}
          startIcon={ctl.isPending ? <CircularProgress size={16} /> : null}
        >
          {ctl.isPending ? "Saving..." : "Save template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
