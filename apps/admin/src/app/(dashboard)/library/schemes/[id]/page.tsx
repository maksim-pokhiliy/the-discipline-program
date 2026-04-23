import { SchemeEditView } from "@app/modules/library-schemes";

type PageProps = {
  params: Promise<{ id: string }>;
};

const LibrarySchemeEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <SchemeEditView id={id} />;
};

export default LibrarySchemeEditPage;
