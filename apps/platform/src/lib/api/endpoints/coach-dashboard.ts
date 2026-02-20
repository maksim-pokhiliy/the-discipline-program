import type { CoachDashboardData } from "@repo/contracts/coach-dashboard";

import { apiClient } from "../client";

export const coachDashboardAPI = {
  getDashboard: (): Promise<CoachDashboardData> =>
    apiClient.request("/api/platform/coach/dashboard"),
};
