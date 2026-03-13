"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Stack, Typography } from "@mui/material";

import type { Workout } from "@repo/contracts/workout";
import { QueryWrapper } from "@repo/query";

import { useMoveWorkout, useWorkouts } from "@app/lib/hooks";

import {
  CopyWeekButton,
  CreateWorkoutDialog,
  WeekNavigator,
  WorkoutDragOverlay,
  useWeekStart,
} from "../components";
import { WeekDayGroup } from "../components/week-day-group";
import { getWeekDays, isSameDay } from "../components/week-helpers";

type PlanScheduleSectionProps = {
  planId: string;
};

export const PlanScheduleSection: React.FC<PlanScheduleSectionProps> = ({ planId }) => {
  const weekStart = useWeekStart();
  const { data: workouts, isLoading, error } = useWorkouts(planId);
  const moveWorkout = useMoveWorkout(planId);

  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const workoutsByDay = useMemo(() => {
    if (!workouts) {
      return new Map<string, Workout[]>();
    }

    const map = new Map<string, Workout[]>();

    for (const day of weekDays) {
      const key = day.toISOString();

      map.set(
        key,
        workouts.filter((w) => w.scheduledDate && isSameDay(new Date(w.scheduledDate), day)),
      );
    }

    return map;
  }, [workouts, weekDays]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const workout = workouts?.find((w) => w.id === event.active.id);

      if (workout) {
        setActiveWorkout(workout);
      }
    },
    [workouts],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveWorkout(null);

      const { active, over } = event;

      if (!over) {
        return;
      }

      const workoutId = active.id as string;
      const targetDate = new Date(over.id as string);
      const workout = workouts?.find((w) => w.id === workoutId);

      if (!workout?.scheduledDate) {
        return;
      }

      const currentDate = new Date(workout.scheduledDate);

      if (!isSameDay(currentDate, targetDate)) {
        moveWorkout.mutate({ workoutId, scheduledDate: targetDate });
      }
    },
    [workouts, moveWorkout],
  );

  return (
    <Stack spacing={2}>
      <WeekNavigator />

      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={workouts}
        loadingMessage="Loading workouts..."
      >
        {() => (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Stack spacing={0.5}>
              {weekDays.map((day) => (
                <WeekDayGroup
                  key={day.toISOString()}
                  date={day}
                  workouts={workoutsByDay.get(day.toISOString()) ?? []}
                  planId={planId}
                  onAddWorkout={(date) => setCreateDate(date)}
                />
              ))}
            </Stack>

            <DragOverlay>
              {activeWorkout && <WorkoutDragOverlay workout={activeWorkout} />}
            </DragOverlay>
          </DndContext>
        )}
      </QueryWrapper>

      <Stack direction="row" sx={{ justifyContent: "center" }}>
        <CopyWeekButton planId={planId} currentWeekStart={weekStart} />
      </Stack>

      {workouts?.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
          No workouts yet. Click + on any day to get started.
        </Typography>
      )}

      <CreateWorkoutDialog
        open={createDate !== null}
        onClose={() => setCreateDate(null)}
        planId={planId}
        defaultDate={createDate}
      />
    </Stack>
  );
};
