import { ExerciseEditView } from "@app/modules/exercises";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExerciseEditPage({ params }: PageProps) {
  const { id } = await params;

  return <ExerciseEditView id={id} />;
}
