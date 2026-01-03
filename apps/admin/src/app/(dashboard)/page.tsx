import { api } from "@app/lib/api";
import { DashboardPageClient } from "@app/modules/dashboard";

export default async function DashboardPage() {
  const initialData = await api.dashboard.getData();

  return <DashboardPageClient initialData={initialData} />;
}
