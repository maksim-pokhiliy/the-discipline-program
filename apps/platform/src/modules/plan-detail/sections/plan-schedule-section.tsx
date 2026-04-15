"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import { Chip, Divider, Stack } from "@mui/material";

import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import type { Workout } from "@repo/contracts/lms/workout";
import { getWeekDays, isSameDay } from "@repo/shared";
import { QueryWrapper } from "@repo/ui";

import {
  useCreateWorkout,
  useMoveWorkout,
  usePlanEnrollments,
  useReorderWorkouts,
  useWeekStart,
  useWorkouts,
} from "@app/lib/hooks";

import { CopyWeekButton, WeekDayGroup, WeekNavigator, WorkoutDragOverlay } from "../components";
import { usePlanScheduleDnd } from "../hooks/use-plan-schedule-dnd";

type PlanScheduleSectionProps = {
  planId: string;
};

const buildWorkoutsByDay = (workouts: Workout[], weekDays: Date[]) => {
  const map = new Map<string, Workout[]>();

  for (const day of weekDays) {
    const key = day.toISOString();

    map.set(
      key,
      workouts
        .filter((w) => w.scheduledDate && isSameDay(new Date(w.scheduledDate), day))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  return map;
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  return rectIntersection(args);
};

export const PlanScheduleSection: React.FC<PlanScheduleSectionProps> = ({ planId }) => {
  const weekStart = useWeekStart();
  const { data: workouts, isLoading, error } = useWorkouts(planId);
  const { data: enrollments } = usePlanEnrollments(planId);
  const moveWorkout = useMoveWorkout(planId);
  const createWorkout = useCreateWorkout(planId);
  const reorderWorkouts = useReorderWorkouts(planId);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const queryWorkoutsByDay = useMemo(
    () => buildWorkoutsByDay(workouts ?? [], weekDays),
    [workouts, weekDays],
  );

  const [focusWorkoutId, setFocusWorkoutId] = useState<string | null>(null);

  const {
    displayItems,
    activeWorkout,
    overDayKey,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = usePlanScheduleDnd({
    workouts,
    weekDays,
    queryWorkoutsByDay,
    moveWorkout,
    reorderWorkouts,
  });

  const weekWorkoutCount = useMemo(
    () =>
      Array.from(displayItems.values()).reduce((sum, dayWorkouts) => sum + dayWorkouts.length, 0),
    [displayItems],
  );

  const activeAthletesCount = useMemo(
    () => enrollments?.filter((e) => e.status === PlanEnrollmentStatus.ACTIVE).length ?? 0,
    [enrollments],
  );

  const handleAddWorkout = useCallback(
    (date: Date) => {
      createWorkout.mutate(
        { scheduledDate: date },
        { onSuccess: (workout) => setFocusWorkoutId(workout.id) },
      );
    },
    [createWorkout],
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
          <>
            {weekWorkoutCount > 0 && (
              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${weekWorkoutCount} workout${weekWorkoutCount === 1 ? "" : "s"} this week`}
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={`${activeAthletesCount} athlete${activeAthletesCount === 1 ? "" : "s"} enrolled`}
                />
              </Stack>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <Stack divider={<Divider />}>
                {weekDays.map((day) => {
                  const dayKey = day.toISOString();

                  return (
                    <WeekDayGroup
                      key={dayKey}
                      date={day}
                      workouts={displayItems.get(dayKey) ?? []}
                      planId={planId}
                      isHighlighted={overDayKey === dayKey}
                      autoFocusWorkoutId={focusWorkoutId}
                      onAddWorkout={handleAddWorkout}
                    />
                  );
                })}
              </Stack>

              <DragOverlay dropAnimation={null}>
                {activeWorkout && <WorkoutDragOverlay workout={activeWorkout} />}
              </DragOverlay>
            </DndContext>

            {weekWorkoutCount > 0 && (
              <Stack direction="row" justifyContent="center">
                <CopyWeekButton planId={planId} currentWeekStart={weekStart} />
              </Stack>
            )}
          </>
        )}
      </QueryWrapper>
    </Stack>
  );
};
