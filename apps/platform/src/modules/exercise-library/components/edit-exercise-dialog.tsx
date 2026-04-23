"use client";

import { useEffect, useState } from "react";

import type { ExerciseListItem } from "@repo/contracts/library/exercise";
import { FormModal } from "@repo/ui";

import { useUpdateLibraryExercise } from "@app/lib/hooks";

import { ExerciseFormFields, type ExerciseFormValues } from "./exercise-form-fields";

type EditExerciseDialogProps = {
  open: boolean;
  exercise: ExerciseListItem | null;
  onClose: () => void;
};

const toFormValues = (exercise: ExerciseListItem): ExerciseFormValues => ({
  canonicalName: exercise.canonicalName,
  description: exercise.description ?? "",
  videoUrl: exercise.videoUrl ?? "",
  measurementUnits: [...exercise.measurementUnits],
  hasLoad: exercise.hasLoad,
});

export const EditExerciseDialog = ({ open, exercise, onClose }: EditExerciseDialogProps) => {
  const [values, setValues] = useState<ExerciseFormValues | null>(null);
  const updateExercise = useUpdateLibraryExercise();

  useEffect(() => {
    if (open && exercise) {
      setValues(toFormValues(exercise));
    }

    if (!open) {
      setValues(null);
    }
  }, [open, exercise]);

  if (!values || !exercise) {
    return null;
  }

  const trimmedName = values.canonicalName.trim();
  const trimmedDescription = values.description.trim();
  const trimmedVideoUrl = values.videoUrl.trim();
  const hasUnits = values.measurementUnits.length > 0;

  const handleClose = () => {
    if (updateExercise.isPending) {
      return;
    }

    onClose();
  };

  const handleSubmit = () => {
    if (!trimmedName || !hasUnits) {
      return;
    }

    updateExercise.mutate(
      {
        id: exercise.id,
        data: {
          canonicalName: trimmedName,
          description: trimmedDescription || undefined,
          videoUrl: trimmedVideoUrl || undefined,
          measurementUnits: values.measurementUnits,
          hasLoad: values.hasLoad,
        },
      },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Edit exercise"
      onSubmit={handleSubmit}
      isSubmitting={updateExercise.isPending}
      submitText="Save changes"
      submitDisabled={!trimmedName || !hasUnits}
    >
      <ExerciseFormFields
        values={values}
        onChange={setValues}
        disabled={updateExercise.isPending}
        nameError={!trimmedName && values.canonicalName.length > 0 ? "Name is required" : null}
        unitsError={!hasUnits ? "Select at least one unit" : null}
      />
    </FormModal>
  );
};
