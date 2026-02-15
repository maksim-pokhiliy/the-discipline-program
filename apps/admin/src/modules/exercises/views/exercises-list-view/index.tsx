"use client";

import { Container } from "@mui/material";

import { type AdminExercisesPageData } from "@repo/contracts/exercise";
import { QueryWrapper } from "@repo/query";

import { useExercisesPageData } from "@app/lib/hooks";

import { ExercisesListSection } from "../../sections";

interface ExercisesListViewProps {
  initialData: AdminExercisesPageData;
}

export const ExercisesListView = ({ initialData }: ExercisesListViewProps) => {
  const { data, isLoading, error } = useExercisesPageData({ initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading exercises..."
    >
      {(data) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <ExercisesListSection exercises={data.exercises} categories={data.categories} />
        </Container>
      )}
    </QueryWrapper>
  );
};
