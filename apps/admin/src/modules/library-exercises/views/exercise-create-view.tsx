"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createExerciseSchema, type CreateExerciseData } from "@repo/contracts/library/exercise";
import { FormView } from "@repo/ui";

import { useCreateLibraryExercise } from "@app/lib/hooks";

import { createExerciseFormDefaults, ExerciseForm } from "../components";

type CreateExerciseInput = z.input<typeof createExerciseSchema>;

export const ExerciseCreateView = () => {
  const { mutate: createExercise, isPending } = useCreateLibraryExercise();

  const methods = useForm<CreateExerciseInput, unknown, CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: createExerciseFormDefaults(),
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createExercise(data)}
      isPending={isPending}
      title="Create Exercise"
      subtitle="Add a new exercise to the library (created as approved)"
      backHref="/library/exercises"
      backLabel="Back to Exercises"
      submitLabel="Create Exercise"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};
