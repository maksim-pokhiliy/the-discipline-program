import { ExerciseEditView } from "@app/modules/library-exercises";

type PageProps = {
  params: Promise<{ id: string }>;
};

const LibraryExerciseEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ExerciseEditView id={id} />;
};

export default LibraryExerciseEditPage;
