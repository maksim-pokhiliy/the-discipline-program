import { api } from "@app/lib/api";
import { ExerciseCreateView } from "@app/modules/exercises";

export const dynamic = "force-dynamic";

export default async function ExerciseCreatePage() {
  const categories = await api.exerciseCategories.getAll();

  return <ExerciseCreateView categories={categories} />;
}
