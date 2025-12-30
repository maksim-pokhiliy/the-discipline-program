import { adminProgramsApi } from "@repo/api/server";

import { ProgramsPageClient } from "@app/modules/programs";

export default async function ProgramsPage() {
  const initialData = await adminProgramsApi.getProgramsPageData();

  return <ProgramsPageClient initialData={initialData} />;
}
