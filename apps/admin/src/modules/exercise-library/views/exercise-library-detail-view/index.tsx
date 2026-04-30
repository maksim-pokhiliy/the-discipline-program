"use client";

import { QueryWrapper } from "@repo/ui";

import { useExercise } from "@app/lib/hooks";

import { ExerciseDetailForm } from "./exercise-detail-form";

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
