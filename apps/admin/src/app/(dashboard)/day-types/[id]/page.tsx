import { DayTypesEditView } from "@app/modules/day-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

const DayTypesEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <DayTypesEditView id={id} />;
};

export default DayTypesEditPage;
