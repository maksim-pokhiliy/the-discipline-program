import { api } from "@app/lib/api";
import { ProgramsListView } from "@app/modules/programs";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const initialData = await api.programs.getPageData();

  return <ProgramsListView initialData={initialData} />;
}
