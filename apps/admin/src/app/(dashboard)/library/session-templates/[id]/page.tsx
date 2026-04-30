import { SessionTemplateLibraryDetailView } from "@app/modules/session-template-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const SessionTemplateLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <SessionTemplateLibraryDetailView id={id} />;
};

export default SessionTemplateLibraryDetailPage;
