"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateExerciseLibraryItemInputSchema,
  type ExerciseLibraryItem,
  type UpdateExerciseLibraryItemInput,
} from "@repo/contracts/lms/exercise-library-item";
import { FormView, QueryWrapper } from "@repo/ui";

import { useExercise, useUpdateExercise } from "@app/lib/hooks";

import { ExerciseLibraryDetailSection } from "../../sections";

type ExerciseDetailFormProps = {
  exercise: ExerciseLibraryItem;
};

const ExerciseDetailForm: React.FC<ExerciseDetailFormProps> = ({ exercise }) => {
  const { mutate: updateExercise, isPending } = useUpdateExercise();

  const methods = useForm<UpdateExerciseLibraryItemInput>({
    resolver: zodResolver(updateExerciseLibraryItemInputSchema),
    defaultValues: {
      scope: exercise.scope,
      name: exercise.name,
      nameAliases: exercise.nameAliases,
      description: exercise.description ?? undefined,
      primaryMovement: exercise.primaryMovement,
      modality: exercise.modality,
      equipment: exercise.equipment,
      primaryBodyParts: exercise.primaryBodyParts,
      secondaryBodyParts: exercise.secondaryBodyParts,
      skillLevel: exercise.skillLevel,
      defaultMetrics: exercise.defaultMetrics,
      demoVideoUrl: exercise.demoVideoUrl ?? undefined,
      demoImageUrl: exercise.demoImageUrl ?? undefined,
      parentId: exercise.parentId ?? undefined,
      isBenchmark: exercise.isBenchmark,
      isDeprecated: exercise.isDeprecated,
      supersedesId: exercise.supersedesId ?? null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updateExercise({ id: exercise.id, data })}
      isPending={isPending}
      title="Edit exercise"
      subtitle={exercise.name}
      backHref="/library/exercises"
      backLabel="Back to Exercises"
    >
      <ExerciseLibraryDetailSection exercise={exercise} isPending={isPending} />
    </FormView>
  );
};

type ExerciseLibraryDetailViewProps = {
  id: string;
};

export const ExerciseLibraryDetailView: React.FC<ExerciseLibraryDetailViewProps> = ({ id }) => {
  const { data, isLoading, error } = useExercise(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading exercise..."
    >
      {(exercise) => <ExerciseDetailForm exercise={exercise} />}
    </QueryWrapper>
  );
};
