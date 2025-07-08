import { Program, Review, DashboardStats, ContactSubmission } from "@repo/api";

import { adminApiClient } from "./client";

export const adminApi = {
  dashboard: {
    getStats: (): Promise<DashboardStats> => adminApiClient.request("/api/admin/dashboard/stats"),
  },

  programs: {
    getAll: (): Promise<Program[]> => adminApiClient.request("/api/admin/programs"),
    getById: (id: string): Promise<Program> => adminApiClient.request(`/api/admin/programs/${id}`),
    create: (data: Partial<Program>): Promise<Program> =>
      adminApiClient.request("/api/admin/programs", "POST", data),
    update: (id: string, data: Partial<Program>): Promise<Program> =>
      adminApiClient.request(`/api/admin/programs/${id}`, "PUT", data),
    delete: (id: string): Promise<void> =>
      adminApiClient.request(`/api/admin/programs/${id}`, "DELETE"),
  },

  reviews: {
    getAll: (): Promise<Review[]> => adminApiClient.request("/api/admin/reviews"),
    getById: (id: string): Promise<Review> => adminApiClient.request(`/api/admin/reviews/${id}`),
    create: (data: Partial<Review>): Promise<Review> =>
      adminApiClient.request("/api/admin/reviews", "POST", data),
    update: (id: string, data: Partial<Review>): Promise<Review> =>
      adminApiClient.request(`/api/admin/reviews/${id}`, "PUT", data),
    delete: (id: string): Promise<void> =>
      adminApiClient.request(`/api/admin/reviews/${id}`, "DELETE"),
  },

  contacts: {
    getAll: (): Promise<ContactSubmission[]> => adminApiClient.request("/api/admin/contacts"),
    getById: (id: string): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/admin/contacts/${id}`),
    updateStatus: (id: string, status: ContactSubmission["status"]): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/admin/contacts/${id}`, "PUT", { status }),
  },
};
