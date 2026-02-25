import { serverApi } from "@app/lib/api/server";
import { ExercisesListView } from "@app/modules/exercises";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const initialData = await serverApi.exercises.getPageData();

  return <ExercisesListView initialData={initialData} />;
}
