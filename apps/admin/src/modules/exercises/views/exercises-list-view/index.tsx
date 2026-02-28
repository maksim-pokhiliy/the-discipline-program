"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useExercisesPageData } from "@app/lib/hooks";

import { ExercisesListSection } from "../../sections";

export const ExercisesListView = () => (
  <AdminListView queryResult={useExercisesPageData()} loadingMessage="Loading exercises...">
    {(data) => <ExercisesListSection exercises={data.exercises} categories={data.categories} />}
  </AdminListView>
);
