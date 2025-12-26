"use client";

import { Program, ProgramStats, AdminProgramsPageData } from "@repo/api";

import { apiClient } from "../client";

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

export const programsAPI = {
  getPageData: (): Promise<AdminProgramsPageData> => apiClient.request("/api/programs/page-data"),

  getAll: (): Promise<Program[]> => apiClient.request("/api/programs"),

  getById: (id: string): Promise<Program> => apiClient.request(`/api/programs/${id}`),

  getStats: (): Promise<ProgramStats> => apiClient.request("/api/programs/stats"),

  create: (data: Partial<Program>): Promise<Program> =>
    apiClient.request("/api/programs", "POST", data),

  update: (id: string, data: Partial<Program>): Promise<Program> =>
    apiClient.request(`/api/programs/${id}`, "PUT", data),

  delete: (id: string): Promise<void> => apiClient.request(`/api/programs/${id}`, "DELETE"),

  toggleStatus: (id: string): Promise<Program> =>
    apiClient.request(`/api/programs/${id}/toggle`, "PATCH"),

  updateOrder: (updates: SortOrderUpdate[]): Promise<{ success: true }> =>
    apiClient.request("/api/programs/order", "PATCH", { updates }),
};
