"use client";

import { type ExerciseStatus } from "@repo/contracts/library/exercise";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useLibraryExercises } from "@app/lib/hooks";

import { ExercisesListSection } from "../sections";

type ExercisesViewProps = {
  defaultStatusFilter?: ExerciseStatus;
  title?: string;
  subtitle?: string;
};

export const ExercisesView = ({
  defaultStatusFilter,
  title = "Exercises",
  subtitle = "Library of canonical exercises used across workouts",
}: ExercisesViewProps) => (
  <AdminListView
    queryResult={useLibraryExercises({
      ...(defaultStatusFilter ? { status: defaultStatusFilter } : {}),
      limit: 100,
    })}
    loadingMessage="Loading exercises..."
    title={title}
    subtitle={subtitle}
  >
    {(data) => (
      <ExercisesListSection exercises={data.items} defaultStatusFilter={defaultStatusFilter} />
    )}
  </AdminListView>
);
