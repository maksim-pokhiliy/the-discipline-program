"use client";

import { QueryWrapper } from "@repo/ui";

import { useExercise } from "@app/lib/hooks";

import { ExercisesEditForm } from "./exercises-edit-form";

type ExercisesEditViewProps = {
  id: string;
};

export const ExercisesEditView: React.FC<ExercisesEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useExercise(id);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading exercise..."
    >
      {(exercise) => <ExercisesEditForm exercise={exercise} />}
    </QueryWrapper>
  );
};
