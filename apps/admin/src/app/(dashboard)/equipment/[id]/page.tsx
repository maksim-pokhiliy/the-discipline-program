import { EquipmentEditView } from "@app/modules/equipment";

type PageProps = {
  params: Promise<{ id: string }>;
};

const EquipmentEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <EquipmentEditView id={id} />;
};

export default EquipmentEditPage;
