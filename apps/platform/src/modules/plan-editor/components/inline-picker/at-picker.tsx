"use client";

import { useMemo } from "react";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { useExercisesPageData } from "@app/lib/hooks";

import { type InlinePickerOption, InlinePickerPopover } from "./inline-picker-popover";

export type AtPickerSelection = {
  kind: "exercise";
  exercise: ExerciseLibraryItem;
};

export type AtPickerProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  query: string;
  onSelect: (selection: AtPickerSelection) => void;
  onClose: () => void;
};

export const AtPicker = ({ open, anchorEl, query, onSelect, onClose }: AtPickerProps) => {
  const exercisesQuery = useExercisesPageData({ search: query, scope: "ALL", take: 20 }, undefined);

  const exerciseLookup = useMemo(() => {
    const map = new Map<string, ExerciseLibraryItem>();

    for (const exercise of exercisesQuery.data?.items ?? []) {
      map.set(exercise.id, exercise);
    }

    return map;
  }, [exercisesQuery.data]);

  const options = useMemo<InlinePickerOption[]>(
    () =>
      (exercisesQuery.data?.items ?? []).map<InlinePickerOption>((exercise) => {
        const parts: string[] = [];

        if (exercise.primaryMovement) {
          parts.push(exercise.primaryMovement);
        }

        if (exercise.modality) {
          parts.push(exercise.modality);
        }

        return {
          id: exercise.id,
          label: exercise.name,
          description: parts.length > 0 ? parts.join(" · ").toLowerCase() : undefined,
        };
      }),
    [exercisesQuery.data],
  );

  const handleSelect = (option: InlinePickerOption) => {
    const exercise = exerciseLookup.get(option.id);

    if (exercise) {
      onSelect({ kind: "exercise", exercise });
    }

    onClose();
  };

  return (
    <InlinePickerPopover
      open={open}
      anchorEl={anchorEl}
      query={query}
      options={options}
      loading={exercisesQuery.isLoading}
      emptyLabel="No exercises"
      onSelect={handleSelect}
      onClose={onClose}
    />
  );
};
