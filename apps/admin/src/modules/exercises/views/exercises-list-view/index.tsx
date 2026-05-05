"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useExercisesPageData } from "@app/lib/hooks";

import { ExercisesListSection } from "../../sections";

export const ExercisesListView = () => (
  <AdminListView
    queryResult={useExercisesPageData()}
    loadingMessage="Loading exercises..."
    title="Exercises"
    subtitle="Manage the movement library available to plans"
  >
    {(data) => <ExercisesListSection exercises={data.exercises} />}
  </AdminListView>
);
