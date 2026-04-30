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
        <LibraryListItem
          key={item.id}
          draggableId={`exercise:${item.id}`}
          payload={{
            kind: "exercise",
            exerciseId: item.id,
            snapshot: {
              id: item.id,
              name: item.name,
              primaryMovement: item.primaryMovement,
              modality: item.modality,
              primaryBodyParts: item.primaryBodyParts,
              defaultMetrics: item.defaultMetrics,
              demoVideoUrl: item.demoVideoUrl,
              demoImageUrl: item.demoImageUrl,
            },
          }}
          name={item.name}
          scope={item.scope}
        />
      ))}
    </Stack>
  );
};
