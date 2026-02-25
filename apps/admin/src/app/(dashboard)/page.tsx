import { serverApi } from "@app/lib/api/server";
import { DashboardPageClient } from "@app/modules/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialData = await serverApi.dashboard.getData();

  return <DashboardPageClient initialData={initialData} />;
}
