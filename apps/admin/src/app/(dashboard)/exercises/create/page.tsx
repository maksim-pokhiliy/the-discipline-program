import { serverApi } from "@app/lib/api/server";
import { ExerciseCreateView } from "@app/modules/exercises";

export const dynamic = "force-dynamic";

export default async function ExerciseCreatePage() {
  const categories = await serverApi.exerciseCategories.getAll();

  return <ExerciseCreateView categories={categories} />;
}
