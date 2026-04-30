"use client";

import { useMemo } from "react";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import { usePlanStructure } from "@app/lib/hooks";

import { type PlanSelection, usePlanCanvasSelection } from "../plan-canvas";

import { useBulkActionContext } from "./bulk-action-context";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { BulkReplaceDialog } from "./bulk-replace-dialog";
import { BulkSuspendDialog } from "./bulk-suspend-dialog";
import { CloneDayDialog } from "./clone-day-dialog";
import { RepeatWeekPatternDialog } from "./repeat-week-pattern-dialog";
import { ShiftWeeksDialog } from "./shift-weeks-dialog";

export type BulkActionToolbarProps = {
  planId: string;
};

const formatLabel = (selection: PlanSelection): string => {
  const noun =
    selection.kind === "block" ? "block" : selection.kind === "segment" ? "segment" : "entry";
  const plural = selection.ids.length === 1 ? noun : `${noun}s`;

  return `${selection.ids.length.toString()} ${plural} selected`;
};

export const BulkActionToolbar = ({ planId }: BulkActionToolbarProps) => {
  const { selection, clearSelection } = usePlanCanvasSelection();
  const planStructure = usePlanStructure(planId);
  const { dialog, openDialog, closeDialog } = useBulkActionContext();

  const visible = useMemo(() => Boolean(selection && selection.ids.length >= 2), [selection]);

  const isEntries = selection?.kind === "entry";
  const isBlocks = selection?.kind === "block";
  const isSegments = selection?.kind === "segment";

  return (
    <>
      {visible && selection && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar - 1,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            px: 2,
            py: 1,
            boxShadow: 3,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip color="primary" label={formatLabel(selection)} size="small" />

            <Stack direction="row" spacing={1} sx={{ flex: 1, flexWrap: "wrap" }} useFlexGap>
              {isEntries && (
                <Button variant="contained" size="small" onClick={() => openDialog("replace")}>
                  Replace exercise
                </Button>
              )}
              {isBlocks && (
                <Button variant="outlined" size="small" onClick={() => openDialog("suspend")}>
                  Suspend blocks
                </Button>
              )}
              {isBlocks && (
                <Button variant="outlined" size="small" onClick={() => openDialog("unsuspend")}>
                  Reactivate blocks
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => openDialog("delete")}
              >
                Delete {isEntries ? "entries" : isSegments ? "segments" : "blocks"}
              </Button>
              <Button variant="text" size="small" onClick={() => openDialog("clone-day")}>
                Clone day
              </Button>
              <Button variant="text" size="small" onClick={() => openDialog("repeat-weeks")}>
                Repeat weeks
              </Button>
              <Button variant="text" size="small" onClick={() => openDialog("shift-weeks")}>
                Shift weeks
              </Button>
            </Stack>

            <Button size="small" onClick={clearSelection}>
              Clear
            </Button>
            <Typography variant="caption" color="text.secondary">
              Cmd/Ctrl+click to add, Shift+click to range
            </Typography>
          </Stack>
        </Box>
      )}

      {selection && (
        <BulkReplaceDialog
          open={dialog === "replace"}
          onClose={closeDialog}
          planId={planId}
          selection={selection}
          planData={planStructure.data}
        />
      )}
      {selection && (
        <BulkSuspendDialog
          open={dialog === "suspend" || dialog === "unsuspend"}
          suspended={dialog === "suspend"}
          onClose={closeDialog}
          planId={planId}
          selection={selection}
          planData={planStructure.data}
        />
      )}
      {selection && (
        <BulkDeleteDialog
          open={dialog === "delete"}
          onClose={closeDialog}
          planId={planId}
          selection={selection}
          planData={planStructure.data}
        />
      )}
      <CloneDayDialog
        open={dialog === "clone-day"}
        onClose={closeDialog}
        planId={planId}
        planData={planStructure.data}
      />
      <RepeatWeekPatternDialog
        open={dialog === "repeat-weeks"}
        onClose={closeDialog}
        planId={planId}
        planData={planStructure.data}
      />
      <ShiftWeeksDialog
        open={dialog === "shift-weeks"}
        onClose={closeDialog}
        planId={planId}
        planData={planStructure.data}
      />
    </>
  );
};
