import { BlockTemplateLibraryDetailView } from "@app/modules/block-template-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const BlockTemplateLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <BlockTemplateLibraryDetailView id={id} />;
};

export default BlockTemplateLibraryDetailPage;
