"use client";

import { type KeyboardEvent, useCallback, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { Workout } from "@repo/contracts/workout";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteWorkout, useUpdateWorkout } from "@app/lib/hooks";

type WeekWorkoutCardProps = {
  workout: Workout;
  planId: string;
  autoFocus?: boolean;
};

export const WeekWorkoutCard: React.FC<WeekWorkoutCardProps> = ({ workout, planId, autoFocus }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.id,
    data: { workout, scheduledDate: workout.scheduledDate },
  });
  const deleteWorkout = useDeleteWorkout(planId);
  const updateWorkout = useUpdateWorkout(planId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editValue, setEditValue] = useState(workout.title);
  const [expanded, setExpanded] = useState(false);

  const hasContent = Boolean(workout.content);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();

    if (trimmed !== workout.title) {
      updateWorkout.mutate({ id: workout.id, data: { title: trimmed } });
    } else {
      setEditValue(workout.title);
    }
  }, [editValue, workout.id, workout.title, updateWorkout]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <Paper ref={setNodeRef} {...attributes} tabIndex={-1} variant="outlined" style={style}>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Stack
            {...listeners}
            tabIndex={-1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              px: 0.5,
              py: 1.5,
              cursor: "grab",
              color: "text.disabled",
              touchAction: "none",
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Stack>

          <InputBase
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder="Workout title..."
            sx={{ flex: 1, typography: "body2", "& input": { p: 0, py: 1, fontWeight: 500 } }}
            slotProps={{ input: { maxLength: 200 } }}
          />

          {hasContent && (
            <IconButton
              size="small"
              onClick={() => setExpanded((prev) => !prev)}
              sx={{ color: "text.disabled" }}
            >
              <ExpandMoreIcon
                fontSize="small"
                sx={(theme) => ({
                  transition: theme.transitions.create("transform"),
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                })}
              />
            </IconButton>
          )}

          <IconButton size="small" sx={{ color: "text.disabled" }}>
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => setConfirmOpen(true)}
            sx={{ mr: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Collapse in={expanded} unmountOnExit>
          <Divider />
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {workout.content}
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteWorkout.mutate(workout.id, { onSuccess: () => setConfirmOpen(false) })
        }
        title="Delete Workout"
        message={`Are you sure you want to delete "${workout.title || "Untitled workout"}"? This action cannot be undone.`}
        type="danger"
        isConfirming={deleteWorkout.isPending}
      />
    </>
  );
};

export const WorkoutDragOverlay: React.FC<{ workout: Workout }> = ({ workout }) => (
  <Paper
    variant="outlined"
    sx={(theme) => ({
      p: 1.5,
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[4],
    })}
  >
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {workout.title || "Untitled workout"}
    </Typography>
  </Paper>
);
