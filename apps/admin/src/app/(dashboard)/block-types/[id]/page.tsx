import { BlockTypesEditView } from "@app/modules/block-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

const BlockTypesEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <BlockTypesEditView id={id} />;
};

export default BlockTypesEditPage;
