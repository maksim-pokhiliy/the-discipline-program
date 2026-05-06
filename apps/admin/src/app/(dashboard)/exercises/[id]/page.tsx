import { ExercisesEditView } from "@app/modules/exercises";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ExercisesEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ExercisesEditView id={id} />;
};

export default ExercisesEditPage;
