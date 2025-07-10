import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api";

export const useAdminApi = {
  useDashboardData: () =>
    useQuery({
      queryKey: ["admin", "dashboard"],
      queryFn: adminApi.dashboard.getData,
    }),

  useDashboardStats: () =>
    useQuery({
      queryKey: ["admin", "dashboard", "stats"],
      queryFn: adminApi.dashboard.getStats,
    }),

  usePrograms: () =>
    useQuery({
      queryKey: ["admin", "programs"],
      queryFn: adminApi.programs.getAll,
    }),

  useReviews: () =>
    useQuery({
      queryKey: ["admin", "reviews"],
      queryFn: adminApi.reviews.getAll,
    }),

  useContacts: () =>
    useQuery({
      queryKey: ["admin", "contacts"],
      queryFn: adminApi.contacts.getAll,
    }),
};

export const useDashboardData = useAdminApi.useDashboardData;
export const useDashboardStats = useAdminApi.useDashboardStats;
export const usePrograms = useAdminApi.usePrograms;
export const useReviews = useAdminApi.useReviews;
export const useContacts = useAdminApi.useContacts;
