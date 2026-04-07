"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Chip, Divider, Stack, Typography } from "@mui/material";

import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import type { Workout } from "@repo/contracts/workout";
import { QueryWrapper } from "@repo/query";

import {
  useCreateWorkout,
  useMoveWorkout,
  usePlanEnrollments,
  useReorderWorkouts,
  useWeekStart,
  useWorkouts,
} from "@app/lib/hooks";

import { CopyWeekButton, WeekNavigator, WorkoutDragOverlay } from "../components";
import { WeekDayGroup } from "../components/week-day-group";
import { getWeekDays, isSameDay } from "../components/week-helpers";

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

const findDayKeyForWorkout = (workoutId: string, items: Map<string, Workout[]>): string | null => {
  for (const [key, workouts] of items) {
    if (workouts.some((w) => w.id === workoutId)) {
      return key;
    }
  }

  return null;
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
  const isDraggingRef = useRef(false);

  const queryWorkoutsByDay = useMemo(
    () => buildWorkoutsByDay(workouts ?? [], weekDays),
    [workouts, weekDays],
  );

  const [localItems, setLocalItems] = useState<Map<string, Workout[]>>(new Map());
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [overDayKey, setOverDayKey] = useState<string | null>(null);
  const [focusWorkoutId, setFocusWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalItems(queryWorkoutsByDay);
    }
  }, [queryWorkoutsByDay]);

  const displayItems = activeWorkout ? localItems : queryWorkoutsByDay;

  const weekWorkoutCount = useMemo(
    () =>
      Array.from(displayItems.values()).reduce((sum, dayWorkouts) => sum + dayWorkouts.length, 0),
    [displayItems],
  );

  const activeAthletesCount = useMemo(
    () => enrollments?.filter((e) => e.status === PlanEnrollmentStatus.ACTIVE).length ?? 0,
    [enrollments],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const workout = workouts?.find((w) => w.id === event.active.id);

      if (workout) {
        isDraggingRef.current = true;
        setLocalItems(queryWorkoutsByDay);
        setActiveWorkout(workout);
      }
    },
    [workouts, queryWorkoutsByDay],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) {
        setOverDayKey(null);

        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeDayKey = findDayKeyForWorkout(activeId, localItems);

      const isOverDay = weekDays.some((d) => d.toISOString() === overId);
      const overDayKeyResolved = isOverDay ? overId : findDayKeyForWorkout(overId, localItems);

      setOverDayKey(overDayKeyResolved);

      if (!activeDayKey || !overDayKeyResolved) {
        return;
      }

      if (activeDayKey !== overDayKeyResolved) {
        setLocalItems((prev) => {
          const newMap = new Map(prev);
          const sourceItems = [...(newMap.get(activeDayKey) ?? [])];
          const targetItems = [...(newMap.get(overDayKeyResolved) ?? [])];

          const activeIndex = sourceItems.findIndex((w) => w.id === activeId);

          if (activeIndex === -1) {
            return prev;
          }

          const movedItem = sourceItems.splice(activeIndex, 1)[0];

          if (!movedItem) {
            return prev;
          }

          const overIndex = targetItems.findIndex((w) => w.id === overId);

          if (overIndex >= 0) {
            targetItems.splice(overIndex, 0, movedItem);
          } else {
            targetItems.push(movedItem);
          }

          newMap.set(activeDayKey, sourceItems);
          newMap.set(overDayKeyResolved, targetItems);

          return newMap;
        });
      } else if (!isOverDay && activeId !== overId) {
        setLocalItems((prev) => {
          const newMap = new Map(prev);
          const items = [...(newMap.get(activeDayKey) ?? [])];
          const oldIndex = items.findIndex((w) => w.id === activeId);
          const newIndex = items.findIndex((w) => w.id === overId);

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
            return prev;
          }

          newMap.set(activeDayKey, arrayMove(items, oldIndex, newIndex));

          return newMap;
        });
      }
    },
    [localItems, weekDays],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      isDraggingRef.current = false;
      setActiveWorkout(null);
      setOverDayKey(null);

      if (!event.over) {
        setLocalItems(queryWorkoutsByDay);

        return;
      }

      const activeId = event.active.id as string;
      const activeDayKey = findDayKeyForWorkout(activeId, localItems);

      if (!activeDayKey) {
        return;
      }

      const dayWorkouts = localItems.get(activeDayKey) ?? [];
      const activeData = event.active.data.current as { scheduledDate?: Date | string | null };
      const originalDate = activeData.scheduledDate ? new Date(activeData.scheduledDate) : null;
      const targetDate = new Date(activeDayKey);
      const crossDay = originalDate && !isSameDay(originalDate, targetDate);

      if (crossDay) {
        moveWorkout.mutate({
          workoutId: activeId,
          scheduledDate: targetDate,
          targetDayOrderedIds: dayWorkouts.map((w) => w.id),
        });
      } else {
        const queryDayWorkouts = queryWorkoutsByDay.get(activeDayKey) ?? [];
        const orderChanged = dayWorkouts.some((w, i) => w.id !== queryDayWorkouts[i]?.id);

        if (orderChanged) {
          reorderWorkouts.mutate(dayWorkouts.map((w) => w.id));
        }
      }
    },
    [localItems, queryWorkoutsByDay, moveWorkout, reorderWorkouts],
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

            <Stack direction="row" sx={{ justifyContent: "center" }}>
              <CopyWeekButton planId={planId} currentWeekStart={weekStart} />
            </Stack>
          </>
        )}
      </QueryWrapper>

      {workouts?.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
          No workouts yet. Click + on any day to get started.
        </Typography>
      )}
    </Stack>
  );
};
