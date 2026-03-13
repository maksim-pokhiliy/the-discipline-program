"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { Workout } from "@repo/contracts/workout";

type WeekWorkoutCardProps = {
  workout: Workout;
  planId: string;
};

export const WeekWorkoutCard: React.FC<WeekWorkoutCardProps> = ({ workout, planId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: workout.id,
    data: { workout },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={style}
      sx={(theme) => ({
        transition: theme.transitions.create("border-color"),
        "&:hover": { borderColor: theme.palette.primary.main },
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <Box
          {...listeners}
          {...attributes}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 0.5,
            py: 1.5,
            cursor: "grab",
            color: "text.disabled",
            touchAction: "none",
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        <Box
          component={Link}
          href={`/coach/plans/${planId}/workouts/${workout.id}`}
          sx={{
            flex: 1,
            textDecoration: "none",
            color: "inherit",
            py: 1,
            pr: 1.5,
            minWidth: 0,
          }}
        >
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {workout.title}
          </Typography>
        </Box>
      </Stack>
    </Paper>
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
      {workout.title}
    </Typography>
  </Paper>
);
