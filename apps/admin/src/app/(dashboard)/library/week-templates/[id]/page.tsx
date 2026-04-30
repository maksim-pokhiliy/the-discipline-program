import { WeekTemplateLibraryDetailView } from "@app/modules/week-template-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const WeekTemplateLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <WeekTemplateLibraryDetailView id={id} />;
};

export default WeekTemplateLibraryDetailPage;
