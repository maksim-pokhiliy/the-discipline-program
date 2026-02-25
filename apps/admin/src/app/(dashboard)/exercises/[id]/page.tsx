import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { ExerciseEditView } from "@app/modules/exercises";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ExerciseEditPage({ params }: PageProps) {
  const { id } = await params;
  const [exercise, categories] = await fetchOrNotFound(() =>
    Promise.all([serverApi.exercises.getById(id), serverApi.exerciseCategories.getAll()]),
  );

  return <ExerciseEditView initialData={exercise} categories={categories} />;
}
