"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Stack, Typography } from "@mui/material";

import type { Workout } from "@repo/contracts/workout";

import { formatDayName, isSameDay } from "./week-helpers";
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
        backgroundColor: isHighlighted ? "action.hover" : "transparent",
        "&:hover .day-action": { opacity: 1 },
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {formatDayName(date)}
          </Typography>

          {isToday ? (
            <Stack
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "primary.contrastText", lineHeight: 1 }}
              >
                {date.getUTCDate()}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 500, color: "text.secondary" }}>
              {date.getUTCDate()}
            </Typography>
          )}
        </Stack>

        <IconButton
          className="day-action"
          size="small"
          onClick={() => onAddWorkout(date)}
          sx={(theme) => ({ opacity: 0, transition: theme.transitions.create("opacity") })}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>

      <SortableContext items={workoutIds} strategy={verticalListSortingStrategy}>
        {workouts.length > 0 && (
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
        )}
      </SortableContext>
    </Stack>
  );
};
