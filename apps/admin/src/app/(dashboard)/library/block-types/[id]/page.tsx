import { BlockTypeEditView } from "@app/modules/library-block-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

const LibraryBlockTypeEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <BlockTypeEditView id={id} />;
};

export default LibraryBlockTypeEditPage;
