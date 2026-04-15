"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import type { Workout } from "@repo/contracts/lms/workout";
import { isSameDay } from "@repo/shared";

type SortableWorkoutData = {
  workout: Workout;
  scheduledDate: Date | string | null;
};

const isSortableWorkoutData = (
  data: Record<string, unknown> | undefined,
): data is SortableWorkoutData =>
  data !== undefined && "workout" in data && "scheduledDate" in data;

const findDayKeyForWorkout = (workoutId: string, items: Map<string, Workout[]>): string | null => {
  for (const [key, workouts] of items) {
    if (workouts.some((w) => w.id === workoutId)) {
      return key;
    }
  }

  return null;
};

type UsePlanScheduleDndParams = {
  workouts: Workout[] | undefined;
  weekDays: Date[];
  queryWorkoutsByDay: Map<string, Workout[]>;
  moveWorkout: {
    mutate: (vars: {
      workoutId: string;
      scheduledDate: Date;
      targetDayOrderedIds: string[];
    }) => void;
  };
  reorderWorkouts: { mutate: (orderedIds: string[]) => void };
};

type UsePlanScheduleDndReturn = {
  displayItems: Map<string, Workout[]>;
  activeWorkout: Workout | null;
  overDayKey: string | null;
  sensors: ReturnType<typeof useSensors>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
};

export const usePlanScheduleDnd = ({
  workouts,
  weekDays,
  queryWorkoutsByDay,
  moveWorkout,
  reorderWorkouts,
}: UsePlanScheduleDndParams): UsePlanScheduleDndReturn => {
  const isDraggingRef = useRef(false);

  const [localItems, setLocalItems] = useState<Map<string, Workout[]>>(new Map());
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [overDayKey, setOverDayKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalItems(queryWorkoutsByDay);
    }
  }, [queryWorkoutsByDay]);

  const displayItems = activeWorkout ? localItems : queryWorkoutsByDay;

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

      const activeId = String(active.id);
      const overId = String(over.id);

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

      const activeId = String(event.active.id);
      const activeDayKey = findDayKeyForWorkout(activeId, localItems);

      if (!activeDayKey) {
        return;
      }

      const dayWorkouts = localItems.get(activeDayKey) ?? [];
      const current = event.active.data.current;
      const rawDate = isSortableWorkoutData(current) ? current.scheduledDate : null;
      const originalDate =
        rawDate instanceof Date ? rawDate : typeof rawDate === "string" ? new Date(rawDate) : null;
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

  return {
    displayItems,
    activeWorkout,
    overDayKey,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
