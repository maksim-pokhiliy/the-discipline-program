"use client";

import { useEffect, useState } from "react";

import { FormModal } from "@repo/ui";

import { useCreateLibraryExercise } from "@app/lib/hooks";

import {
  ExerciseFormFields,
  INITIAL_EXERCISE_FORM,
  type ExerciseFormValues,
} from "./exercise-form-fields";

type CreateExerciseDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateExerciseDialog = ({ open, onClose }: CreateExerciseDialogProps) => {
  const [values, setValues] = useState<ExerciseFormValues>(INITIAL_EXERCISE_FORM);
  const createExercise = useCreateLibraryExercise();

  useEffect(() => {
    if (open) {
      setValues(INITIAL_EXERCISE_FORM);
    }
  }, [open]);

  const trimmedName = values.canonicalName.trim();
  const trimmedDescription = values.description.trim();
  const trimmedVideoUrl = values.videoUrl.trim();
  const hasUnits = values.measurementUnits.length > 0;

  const handleClose = () => {
    if (createExercise.isPending) {
      return;
    }

    onClose();
  };

  const handleSubmit = () => {
    if (!trimmedName || !hasUnits) {
      return;
    }

    createExercise.mutate(
      {
        canonicalName: trimmedName,
        aliases: [],
        description: trimmedDescription || undefined,
        videoUrl: trimmedVideoUrl || undefined,
        measurementUnits: values.measurementUnits,
        hasLoad: values.hasLoad,
      },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Create exercise"
      onSubmit={handleSubmit}
      isSubmitting={createExercise.isPending}
      submitText="Create"
      submitDisabled={!trimmedName || !hasUnits}
    >
      <ExerciseFormFields
        values={values}
        onChange={setValues}
        disabled={createExercise.isPending}
        nameError={!trimmedName && values.canonicalName.length > 0 ? "Name is required" : null}
        unitsError={!hasUnits ? "Select at least one unit" : null}
      />
    </FormModal>
  );
};
