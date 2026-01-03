import { api } from "@app/lib/api";
import { ProgramsPageClient } from "@app/modules/programs";

export default async function ProgramsPage() {
  const initialData = await api.programs.getPageData();

  return <ProgramsPageClient initialData={initialData} />;
}
