"use client";

import { DashboardData } from "@repo/api";

import { apiClient } from "../client";

export const dashboardAPI = {
  getData: (): Promise<DashboardData> => apiClient.request("/api/dashboard"),
};
