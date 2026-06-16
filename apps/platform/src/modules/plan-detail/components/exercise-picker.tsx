"use client";

import { useMemo, useState } from "react";

import { CreatablePicker, type CreatableOption, usePromiseModal } from "@repo/ui";

import { useExercises } from "@app/lib/hooks";

import { ExerciseCreateModal } from "./exercise-create-modal";

const SEARCH_PLACEHOLDER = "search by name or create a movement…";
const REQUIRED_EXERCISE_MESSAGE = "Pick an exercise";
const NO_OPTIONS_TEXT = "Type to search exercises";

type ExercisePickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  disabled?: boolean;
  placeholderOnly?: boolean;
  compact?: boolean;
  label?: string;
};

export const ExercisePicker = ({
  value,
  onChange,
  error = false,
  disabled = false,
  placeholderOnly = false,
  compact = false,
  label,
}: ExercisePickerProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const [inputValue, setInputValue] = useState("");
  const createModal = usePromiseModal<{ initialName: string }, CreatableOption>();

  const options = useMemo<CreatableOption[]>(() => {
    const visible = placeholderOnly
      ? exercises.filter((exercise) => exercise.nature === "PLACEHOLDER")
      : exercises;

    return visible.map((exercise) => ({ id: exercise.id, label: exercise.canonicalName }));
  }, [exercises, placeholderOnly]);

  const selected = useMemo<CreatableOption | null>(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  return (
    <>
      <CreatablePicker
        options={options}
        value={selected}
        onChange={(option) => onChange(option?.id ?? null)}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onCreateOption={(name) => createModal.open({ initialName: name })}
        loading={isLoading}
        disabled={disabled || isLoading}
        size={compact ? "small" : "medium"}
        placeholder={SEARCH_PLACEHOLDER}
        noOptionsText={NO_OPTIONS_TEXT}
        {...(label !== undefined && { label })}
        {...(error && { error: REQUIRED_EXERCISE_MESSAGE })}
      />

      <ExerciseCreateModal controller={createModal} />
    </>
  );
};
