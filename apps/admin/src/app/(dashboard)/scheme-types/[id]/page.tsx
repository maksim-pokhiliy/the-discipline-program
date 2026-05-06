import { SchemeTypesEditView } from "@app/modules/scheme-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

const SchemeTypesEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <SchemeTypesEditView id={id} />;
};

export default SchemeTypesEditPage;
