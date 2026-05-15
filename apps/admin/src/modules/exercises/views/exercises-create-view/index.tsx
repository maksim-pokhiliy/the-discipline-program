"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { createExerciseSchema, type CreateExerciseData } from "@repo/contracts/cms/exercise";
import { FormView } from "@repo/ui";

import { useCreateExercise } from "@app/lib/hooks";

import { ExerciseForm } from "../../components";

type CreateExerciseInput = z.input<typeof createExerciseSchema>;

export const ExercisesCreateView = () => {
  const { mutate: createExercise, isPending } = useCreateExercise();

  const methods = useForm<CreateExerciseInput, unknown, CreateExerciseData>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      canonicalName: "",
      primaryEquipment: "BARBELL",
      movementTypeTagPrimary: "SQUAT",
      movementTypeTagSecondary: null,
      canonicalCompoundType: "ATOMIC",
      placeholderFlag: false,
      movementFamily: null,
      defaultDemoUrls: [],
      aliases: [],
      notes: null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createExercise(data)}
      isPending={isPending}
      title="Create Exercise"
      subtitle="Add a movement to the coach library"
      backHref="/exercises"
      backLabel="Back to exercises"
      submitLabel="Create"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};
