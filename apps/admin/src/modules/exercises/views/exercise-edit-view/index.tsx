"use client";

import { useCallback } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  type CreateExerciseData,
  type Exercise,
  createExerciseSchema,
} from "@repo/contracts/exercise";
import { type ExerciseCategory } from "@repo/contracts/exercise-category";
import { QueryWrapper } from "@repo/query";
import { FormView } from "@repo/ui";

import {
  useCreateExerciseCategory,
  useExercise,
  useExerciseCategories,
  useUpdateExercise,
} from "@app/lib/hooks";

import { ExerciseForm } from "../../components/exercise-form";

type ExerciseEditFormProps = {
  exercise: Exercise;
  categories: ExerciseCategory[];
};

const ExerciseEditForm: React.FC<ExerciseEditFormProps> = ({ exercise, categories }) => {
  const { mutate: updateExercise, isPending } = useUpdateExercise();
  const { mutateAsync: createCategory } = useCreateExerciseCategory();

  const methods = useForm<CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: exercise.name,
      description: exercise.description ?? "",
      videoUrl: exercise.videoUrl ?? "",
      categoryId: exercise.categoryId ?? "",
    },
  });

  const handleCreateCategory = useCallback(
    (name: string) => createCategory({ name, sortOrder: categories.length }),
    [createCategory, categories.length],
  );

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateExercise({ id: exercise.id, data })}
      isPending={isPending}
      title="Edit Exercise"
      subtitle={exercise.name}
      backgroundColor="dark"
      backHref="/exercises"
      backLabel="Back to Exercises"
    >
      <ExerciseForm
        categories={categories}
        onCreateCategory={handleCreateCategory}
        isLoading={isPending}
      />
    </FormView>
  );
};

type ExerciseEditViewProps = {
  id: string;
};

export const ExerciseEditView: React.FC<ExerciseEditViewProps> = ({ id }) => {
  const exerciseQuery = useExercise(id);
  const { data: categories = [] } = useExerciseCategories();

  return (
    <QueryWrapper
      isLoading={exerciseQuery.isLoading}
      error={exerciseQuery.error}
      data={exerciseQuery.data}
      loadingMessage="Loading exercise..."
    >
      {(exercise) => <ExerciseEditForm exercise={exercise} categories={categories} />}
    </QueryWrapper>
  );
};
