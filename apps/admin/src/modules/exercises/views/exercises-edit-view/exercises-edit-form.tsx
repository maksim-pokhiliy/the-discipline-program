"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createExerciseSchema,
  type CreateExerciseData,
  type Exercise,
} from "@repo/contracts/lms/exercise";
import { FormView } from "@repo/ui";

import { useUpdateExercise } from "@app/lib/hooks";

import { ExerciseForm } from "../../components";

type CreateExerciseInput = z.input<typeof createExerciseSchema>;

type ExercisesEditFormProps = {
  exercise: Exercise;
};

export const ExercisesEditForm: React.FC<ExercisesEditFormProps> = ({ exercise }) => {
  const { mutate: updateExercise, isPending } = useUpdateExercise();

  const methods = useForm<CreateExerciseInput, unknown, CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      name: exercise.name,
      urls: exercise.urls,
      primaryMovement: exercise.primaryMovement,
      ...(exercise.benchmarkPrKind ? { benchmarkPrKind: exercise.benchmarkPrKind } : {}),
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateExercise({ id: exercise.id, data })}
      isPending={isPending}
      title="Edit Exercise"
      subtitle={exercise.name}
      backHref="/exercises"
      backLabel="Back to List"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};
