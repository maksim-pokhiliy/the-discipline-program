"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { Workout } from "@repo/contracts/workout";

import { formatDayHeader, isSameDay } from "./week-helpers";
import { WeekWorkoutCard } from "./week-workout-card";

type WeekDayGroupProps = {
  date: Date;
  workouts: Workout[];
  planId: string;
  isHighlighted: boolean;
  autoFocusWorkoutId: string | null;
  onAddWorkout: (date: Date) => void;
};

export const WeekDayGroup: React.FC<WeekDayGroupProps> = ({
  date,
  workouts,
  planId,
  isHighlighted,
  autoFocusWorkoutId,
  onAddWorkout,
}) => {
  const { setNodeRef } = useDroppable({ id: date.toISOString() });
  const isToday = isSameDay(date, new Date());
  const workoutIds = workouts.map((w) => w.id);

  return (
    <Stack
      ref={setNodeRef}
      spacing={1}
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 1,
        minHeight: theme.spacing(10),
        transition: theme.transitions.create("background-color"),
        backgroundColor: isHighlighted
          ? "action.hover"
          : isToday
            ? alpha(theme.palette.primary.main, 0.06)
            : "transparent",
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: isToday ? 700 : 500,
            color: isToday ? "primary.main" : "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {formatDayHeader(date)}
        </Typography>

        <IconButton size="small" onClick={() => onAddWorkout(date)}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>

      <SortableContext items={workoutIds} strategy={verticalListSortingStrategy}>
        {workouts.length > 0 ? (
          <Stack spacing={0.75}>
            {workouts.map((workout) => (
              <WeekWorkoutCard
                key={workout.id}
                workout={workout}
                planId={planId}
                autoFocus={workout.id === autoFocusWorkoutId}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled", textAlign: "center", py: 1 }}>
            Rest day
          </Typography>
        )}
      </SortableContext>
    </Stack>
  );
};
