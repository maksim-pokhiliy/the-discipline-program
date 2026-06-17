"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePlanTimetable = () => {
  return useQuery({
    queryKey: platformKeys.planTimetable.data(),
    queryFn: () => api.planTimetable.get(),
  });
};
