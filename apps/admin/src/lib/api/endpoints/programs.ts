"use client";

import { Program, ProgramStats, AdminProgramsPageData } from "@repo/api";

import { apiClient } from "../client";

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

export const programsAPI = {
  getPageData: (): Promise<AdminProgramsPageData> =>
    apiClient.request("/api/admin/programs/page-data"),

  getAll: (): Promise<Program[]> => apiClient.request("/api/admin/programs"),

  getById: (id: string): Promise<Program> => apiClient.request(`/api/admin/programs/${id}`),

  getStats: (): Promise<ProgramStats> => apiClient.request("/api/admin/programs/stats"),

  create: (data: Partial<Program>): Promise<Program> =>
    apiClient.request("/api/admin/programs", "POST", data),

  update: (id: string, data: Partial<Program>): Promise<Program> =>
    apiClient.request(`/api/admin/programs/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/admin/programs/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<Program> =>
    apiClient.request(`/api/admin/programs/${id}/toggle`, "PATCH"),

  updateOrder: (updates: SortOrderUpdate[]): Promise<{ success: true }> =>
    apiClient.request("/api/admin/programs/order", "PATCH", { updates }),
};
