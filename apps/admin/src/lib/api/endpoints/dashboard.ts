import { type ApiClient } from "@repo/api-client";
import { type DashboardData } from "@repo/contracts/cms/dashboard";

export const createDashboardAPI = (client: ApiClient) => ({
  getData: (): Promise<DashboardData> => client.request("/api/admin/dashboard"),
});
