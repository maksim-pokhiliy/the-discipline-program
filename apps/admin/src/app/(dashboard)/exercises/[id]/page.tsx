import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { ExerciseEditView } from "@app/modules/exercises";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ExerciseEditPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const [exercise, categories] = await Promise.all([
      api.exercises.getById(id),
      api.exerciseCategories.getAll(),
    ]);

    return <ExerciseEditView initialData={exercise} categories={categories} />;
  } catch {
    return notFound();
  }
}
