"use client";

import { Stack } from "@mui/material";

import { PageHeader, QueryWrapper } from "@repo/ui";

import { useMyLibraryExercises } from "@app/lib/hooks";

import { ExercisesListSection } from "../sections";

export const ExerciseLibraryView = () => {
  const { data, isLoading, error } = useMyLibraryExercises();

  return (
    <Stack spacing={4}>
      <PageHeader title="Exercise library" />

      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading exercises..."
      >
        {(response) => <ExercisesListSection exercises={response.items} />}
      </QueryWrapper>
    </Stack>
  );
};
