"use client";

import { type AdminExercisesPageData } from "@repo/contracts/exercise";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useExercisesPageData } from "@app/lib/hooks";

import { ExercisesListSection } from "../../sections";

interface ExercisesListViewProps {
  initialData: AdminExercisesPageData;
}

export const ExercisesListView = ({ initialData }: ExercisesListViewProps) => (
  <AdminListView
    queryResult={useExercisesPageData({ initialData })}
    loadingMessage="Loading exercises..."
  >
    {(data) => <ExercisesListSection exercises={data.exercises} categories={data.categories} />}
  </AdminListView>
);
