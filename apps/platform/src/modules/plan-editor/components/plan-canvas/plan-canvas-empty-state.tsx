"use client";

import { useDroppable } from "@dnd-kit/core";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Box, Button, Stack, Typography } from "@mui/material";

import { AddWeekDialog } from "./add-week-dialog";
import { useAddWeekDialog } from "./use-add-week-dialog";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type PlanCanvasEmptyStateProps = {
  planId: string;
};

export const PlanCanvasEmptyState = ({ planId }: PlanCanvasEmptyStateProps) => {
  const dialog = useAddWeekDialog();
  const touchTargetSx = useTouchTargetSx();
  const droppable = useDroppable({ id: "week:new", data: { kind: "week-new" } });

  return (
    <Box
      ref={droppable.setNodeRef}
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        bgcolor: droppable.isOver ? "action.hover" : "transparent",
        transition: "background-color 0.15s",
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 360, textAlign: "center" }}>
        <CalendarMonthIcon sx={{ fontSize: 56, color: "text.secondary" }} />
        <Stack spacing={0.5}>
          <Typography variant="h6">Plan is empty</Typography>
          <Typography variant="body2" color="text.secondary">
            Start by adding your first week.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={dialog.open}
          sx={touchTargetSx}
        >
          Add week
        </Button>
      </Stack>
      <AddWeekDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        planId={planId}
        defaultIndex={0}
      />
    </Box>
  );
};
