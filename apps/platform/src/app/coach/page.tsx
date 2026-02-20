import { api } from "@app/lib/api";
import { DashboardView } from "@app/modules/dashboard";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const initialData = await api.coachDashboard.getDashboard();

  return <DashboardView initialData={initialData} />;
}
