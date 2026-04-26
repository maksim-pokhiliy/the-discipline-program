"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useExercisesPageData } from "@app/lib/hooks";

import { ExerciseLibraryListSection } from "../../sections";

export const ExerciseLibraryListView = () => (
  <AdminListView
    queryResult={useExercisesPageData()}
    loadingMessage="Loading exercises..."
    title="Exercise Library"
    subtitle="System-wide and coach-owned exercise definitions"
  >
    {(data) => <ExerciseLibraryListSection items={data.items} />}
  </AdminListView>
);
