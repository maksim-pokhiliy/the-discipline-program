import { api } from "@app/lib/api";
import { fetchOrNotFound } from "@app/lib/fetch-or-not-found";
import { ExerciseEditView } from "@app/modules/exercises";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ExerciseEditPage({ params }: PageProps) {
  const { id } = await params;
  const [exercise, categories] = await fetchOrNotFound(() =>
    Promise.all([api.exercises.getById(id), api.exerciseCategories.getAll()]),
  );

  return <ExerciseEditView initialData={exercise} categories={categories} />;
}
