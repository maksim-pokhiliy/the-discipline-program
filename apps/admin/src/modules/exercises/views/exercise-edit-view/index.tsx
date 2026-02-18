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
import { FormView } from "@repo/ui";

import {
  useCreateExerciseCategory,
  useExercise,
  useExerciseCategories,
  useUpdateExercise,
} from "@app/lib/hooks";

import { ExerciseForm } from "../../components/exercise-form";

interface ExerciseEditViewProps {
  initialData: Exercise;
  categories: ExerciseCategory[];
}

export const ExerciseEditView = ({
  initialData,
  categories: initialCategories,
}: ExerciseEditViewProps) => {
  const { data: exercise } = useExercise(initialData.id, initialData);
  const { data: categories = initialCategories } = useExerciseCategories(initialCategories);
  const { mutate: updateExercise, isPending } = useUpdateExercise();
  const { mutateAsync: createCategory } = useCreateExerciseCategory();

  const methods = useForm<CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: exercise?.name ?? "",
      description: exercise?.description ?? "",
      videoUrl: exercise?.videoUrl ?? "",
      categoryId: exercise?.categoryId ?? "",
    },
  });

  const handleCreateCategory = useCallback(
    (name: string) => createCategory({ name, sortOrder: categories.length }),
    [createCategory, categories.length],
  );

  if (!exercise) {
    return null;
  }

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
