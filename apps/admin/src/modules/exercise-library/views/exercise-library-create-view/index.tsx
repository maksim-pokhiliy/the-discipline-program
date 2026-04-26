"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createExerciseLibraryItemInputSchema,
  type CreateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormView } from "@repo/ui";

import { useCreateExercise } from "@app/lib/hooks";

import { ExerciseLibraryForm } from "../../components";

type CreateInput = z.input<typeof createExerciseLibraryItemInputSchema>;

export const ExerciseLibraryCreateView = () => {
  const { mutate: createExercise, isPending } = useCreateExercise();

  const methods = useForm<CreateInput, unknown, CreateExerciseLibraryItemInput>({
    resolver: zodResolver(createExerciseLibraryItemInputSchema),
    defaultValues: {
      scope: "COACH",
      name: "",
      nameAliases: [],
      description: undefined,
      primaryMovement: "SQUAT",
      modality: "BARBELL",
      equipment: [],
      primaryBodyParts: [],
      secondaryBodyParts: [],
      skillLevel: "BEGINNER",
      defaultMetrics: {
        canMeasureLoad: false,
        canMeasureReps: false,
        canMeasureDuration: false,
        canMeasureDistance: false,
        canMeasureCalories: false,
      },
      demoVideoUrl: undefined,
      demoImageUrl: undefined,
      parentId: undefined,
      isBenchmark: false,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createExercise(data)}
      isPending={isPending}
      title="Create exercise"
      subtitle="Add a new entry to the exercise library"
      backHref="/library/exercises"
      backLabel="Back to Exercises"
      submitLabel="Create exercise"
    >
      <ExerciseLibraryForm isLoading={isPending} />
    </FormView>
  );
};
