import { ExerciseLibraryDetailView } from "@app/modules/exercise-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ExerciseLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ExerciseLibraryDetailView id={id} />;
};

export default ExerciseLibraryDetailPage;
