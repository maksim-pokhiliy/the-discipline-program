import { serverApi } from "@app/lib/api/server";
import { DashboardView } from "@app/modules/dashboard";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  await serverApi.coachActionItems.reconcile();
  const initialData = await serverApi.coachDashboard.getDashboard();

  return <DashboardView initialData={initialData} />;
}
