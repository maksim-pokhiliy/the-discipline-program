"use client";

import {
  Program,
  Review,
  DashboardData,
  ContactSubmission,
  ProgramStats,
  AdminProgramsPageData,
  ReviewStats,
  AdminReviewsPageData,
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
    getPageData: (): Promise<AdminReviewsPageData> =>
      adminApiClient.request("/api/reviews/page-data"),
    getAll: (): Promise<Review[]> => adminApiClient.request("/api/reviews"),
    getById: (id: string): Promise<Review> => adminApiClient.request(`/api/reviews/${id}`),
    getStats: (): Promise<ReviewStats> => adminApiClient.request("/api/reviews/stats"),
    create: (data: Partial<Review>): Promise<Review> =>
      adminApiClient.request("/api/reviews", "POST", data),
    update: (id: string, data: Partial<Review>): Promise<Review> =>
      adminApiClient.request(`/api/reviews/${id}`, "PUT", data),
    delete: (id: string): Promise<void> => adminApiClient.request(`/api/reviews/${id}`, "DELETE"),
    toggleActive: (id: string): Promise<Review> =>
      adminApiClient.request(`/api/reviews/${id}/toggle-active`, "PATCH"),
    toggleFeatured: (id: string): Promise<Review> =>
      adminApiClient.request(`/api/reviews/${id}/toggle-featured`, "PATCH"),
  },

  contacts: {
    getAll: (): Promise<ContactSubmission[]> => adminApiClient.request("/api/contacts"),
    getById: (id: string): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/contacts/${id}`),
    updateStatus: (id: string, status: ContactSubmission["status"]): Promise<ContactSubmission> =>
      adminApiClient.request(`/api/contacts/${id}`, "PUT", { status }),
  },

  upload: {
    avatar: (file: File): Promise<{ url: string }> => {
      const formData = new FormData();

      formData.append("file", file);

      return adminApiClient.request("/api/upload/avatar", "POST", formData);
    },

    deleteAvatar: (url: string): Promise<void> =>
      adminApiClient.request("/api/upload/avatar", "DELETE", { url }),
  },
};
