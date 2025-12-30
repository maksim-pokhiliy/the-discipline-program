import { adminDashboardApi } from "@repo/api/server";

import { DashboardPageClient } from "@app/modules/dashboard";

export default async function DashboardPage() {
  const initialData = await adminDashboardApi.getDashboardData();

  return <DashboardPageClient initialData={initialData} />;
}
