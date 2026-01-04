import { type DashboardData } from "@repo/contracts/dashboard";

import { apiClient } from "../client";

export const dashboardAPI = {
  getData: (): Promise<DashboardData> => apiClient.request("api/admin/dashboard"),
};
