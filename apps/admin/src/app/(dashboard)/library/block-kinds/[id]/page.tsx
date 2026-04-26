import { BlockKindLibraryDetailView } from "@app/modules/block-kind-library";

type PageProps = {
  params: Promise<{ id: string }>;
};

const BlockKindLibraryDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <BlockKindLibraryDetailView id={id} />;
};

export default BlockKindLibraryDetailPage;
