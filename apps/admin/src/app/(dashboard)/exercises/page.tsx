import { api } from "@app/lib/api";
import { ExercisesListView } from "@app/modules/exercises";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const initialData = await api.exercises.getPageData();

  return <ExercisesListView initialData={initialData} />;
}
