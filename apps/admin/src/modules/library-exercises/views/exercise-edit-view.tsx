"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateExerciseSchema,
  type Exercise,
  type UpdateExerciseData,
} from "@repo/contracts/library/exercise";
import { FormView, QueryWrapper } from "@repo/ui";

import { useLibraryExercise, useUpdateLibraryExercise } from "@app/lib/hooks";

import { ExerciseForm, exerciseToFormDefaults } from "../components";

type ExerciseEditFormProps = {
  exercise: Exercise;
};

const ExerciseEditForm = ({ exercise }: ExerciseEditFormProps) => {
  const { mutate: updateExercise, isPending } = useUpdateLibraryExercise();

  const methods = useForm<UpdateExerciseData>({
    resolver: zodResolver(updateExerciseSchema),
    defaultValues: exerciseToFormDefaults(exercise),
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateExercise({ id: exercise.id, data })}
      isPending={isPending}
      title="Edit Exercise"
      subtitle={exercise.canonicalName}
      backHref="/library/exercises"
      backLabel="Back to Exercises"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};

type ExerciseEditViewProps = {
  id: string;
};

export const ExerciseEditView = ({ id }: ExerciseEditViewProps) => {
  const { data, isLoading, error } = useLibraryExercise(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading exercise..."
    >
      {(exercise) => <ExerciseEditForm exercise={exercise} />}
    </QueryWrapper>
  );
};
