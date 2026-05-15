"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createExerciseSchema,
  type CreateExerciseData,
  type Exercise,
} from "@repo/contracts/cms/exercise";
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
      canonicalName: exercise.canonicalName,
      primaryEquipment: exercise.primaryEquipment,
      movementTypeTagPrimary: exercise.movementTypeTagPrimary,
      movementTypeTagSecondary: exercise.movementTypeTagSecondary,
      canonicalCompoundType: exercise.canonicalCompoundType,
      placeholderFlag: exercise.placeholderFlag,
      movementFamily: exercise.movementFamily,
      defaultDemoUrls: exercise.defaultDemoUrls,
      aliases: exercise.aliases,
      notes: exercise.notes,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateExercise({ id: exercise.id, data })}
      isPending={isPending}
      title="Edit Exercise"
      subtitle={exercise.canonicalName}
      backHref="/exercises"
      backLabel="Back to exercises"
      submitLabel="Save changes"
    >
      <ExerciseForm isLoading={isPending} />
    </FormView>
  );
};
