import {
  Program,
  Review,
  DashboardData,
  ContactSubmission,
  ProgramStats,
  AdminProgramsPageData,
} from "@repo/api";

import { adminApiClient } from "./client";

export const adminApi = {
  dashboard: {
    getData: (): Promise<DashboardData> => adminApiClient.request("/api/dashboard"),
  },

  programs: {
    getPageData: (): Promise<AdminProgramsPageData> =>
      adminApiClient.request("/api/programs/page-data"),
    getAll: (): Promise<Program[]> => adminApiClient.request("/api/programs"),
    getById: (id: string): Promise<Program> => adminApiClient.request(`/api/programs/${id}`),
    getStats: (): Promise<ProgramStats> => adminApiClient.request("/api/programs/stats"),
    create: (data: Partial<Program>): Promise<Program> =>
      adminApiClient.request("/api/programs", "POST", data),
    update: (id: string, data: Partial<Program>): Promise<Program> =>
      adminApiClient.request(`/api/programs/${id}`, "PUT", data),
    delete: (id: string): Promise<void> => adminApiClient.request(`/api/programs/${id}`, "DELETE"),
    toggleStatus: (id: string): Promise<Program> =>
      adminApiClient.request(`/api/programs/${id}/toggle`, "PATCH"),
  },

  reviews: {
    getAll: (): Promise<Review[]> => adminApiClient.request("/api/reviews"),
    getById: (id: string): Promise<Review> => adminApiClient.request(`/api/reviews/${id}`),
    create: (data: Partial<Review>): Promise<Review> =>
      adminApiClient.request("/api/reviews", "POST", data),
    update: (id: string, data: Partial<Review>): Promise<Review> =>
      adminApiClient.request(`/api/reviews/${id}`, "PUT", data),
    delete: (id: string): Promise<void> => adminApiClient.request(`/api/reviews/${id}`, "DELETE"),
  },

  contacts: {
    getAll: (): Promise<ContactSubmission[]> => adminApiClient.request("/api/contacts"),
    getById: (id: string): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/contacts/${id}`),
    updateStatus: (id: string, status: ContactSubmission["status"]): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/contacts/${id}`, "PUT", { status }),
  },
};
