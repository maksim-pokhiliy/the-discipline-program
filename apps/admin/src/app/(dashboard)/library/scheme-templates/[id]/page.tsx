import { SchemeTemplateLibraryDetailView } from "@app/modules/scheme-template-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const SchemeTemplateLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <SchemeTemplateLibraryDetailView id={id} />;
};

export default SchemeTemplateLibraryDetailPage;
