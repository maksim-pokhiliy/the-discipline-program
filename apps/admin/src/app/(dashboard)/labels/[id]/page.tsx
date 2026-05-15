import { LabelsEditView } from "@app/modules/labels";

type PageProps = {
  params: Promise<{ id: string }>;
};

const LabelsEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <LabelsEditView id={id} />;
};

export default LabelsEditPage;
