"use client";

import { Stack, Typography } from "@mui/material";

import { useExercisesPageData } from "@app/lib/hooks";

import { LibraryListItem } from "./library-list-item";

type ExerciseListProps = {
  search: string;
  currentUserId: string;
};

export const ExerciseList = ({ search, currentUserId }: ExerciseListProps) => {
  const { data, isLoading } = useExercisesPageData(
    { search: search.length > 0 ? search : undefined },
    currentUserId,
  );

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No exercises
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <LibraryListItem key={item.id} name={item.name} scope={item.scope} />
      ))}
    </Stack>
  );
};
