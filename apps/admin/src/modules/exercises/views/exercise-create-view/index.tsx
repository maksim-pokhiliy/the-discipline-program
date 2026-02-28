"use client";

import { useCallback } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type CreateExerciseData, createExerciseSchema } from "@repo/contracts/exercise";
import { FormView } from "@repo/ui";

import {
  useCreateExercise,
  useCreateExerciseCategory,
  useExerciseCategories,
} from "@app/lib/hooks";

import { ExerciseForm } from "../../components/exercise-form";

export const ExerciseCreateView = () => {
  const { data: categories = [] } = useExerciseCategories();
  const { mutate: createExercise, isPending } = useCreateExercise();
  const { mutateAsync: createCategory } = useCreateExerciseCategory();

  const methods = useForm<CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      videoUrl: "",
    },
  });

  const handleCreateCategory = useCallback(
    (name: string) => createCategory({ name, sortOrder: categories.length }),
    [createCategory, categories.length],
  );

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createExercise(data)}
      isPending={isPending}
      title="Create Exercise"
      subtitle="Add a new exercise to the library"
      backgroundColor="dark"
      backHref="/exercises"
      backLabel="Back to Exercises"
      submitLabel="Save Exercise"
    >
      <ExerciseForm
        categories={categories}
        onCreateCategory={handleCreateCategory}
        isLoading={isPending}
      />
    </FormView>
  );
};
