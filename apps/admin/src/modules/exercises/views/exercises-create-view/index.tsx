"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createExerciseSchema, type CreateExerciseData } from "@repo/contracts/lms/exercise";
import { FormView } from "@repo/ui";

import { useCreateExercise } from "@app/lib/hooks";

import { ExerciseForm } from "../../components";

type CreateExerciseInput = z.input<typeof createExerciseSchema>;

export const ExercisesCreateView = () => {
  const { mutate: createExercise, isPending } = useCreateExercise();

  const methods = useForm<CreateExerciseInput, unknown, CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: "",
      urls: [],
      primaryMovement: "SQUAT",
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createExercise(data)}
      isPending={isPending}
      title="Create Exercise"
      subtitle="Add a new movement to the library"
      backHref="/exercises"
      backLabel="Back to List"
      submitLabel="Create Exercise"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};
