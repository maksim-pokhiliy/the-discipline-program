import { type ApiClient } from "@repo/api-client";
import type { CoachDashboardData } from "@repo/contracts/coach-dashboard";

export const createCoachDashboardAPI = (client: ApiClient) => ({
  getDashboard: (): Promise<CoachDashboardData> => client.request("/api/platform/coach/dashboard"),
});
