"use client";

import { useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCalendarWeek = (weekStart: Date) =>
  useQuery({
    queryKey: platformKeys.calendar.week(weekStart.toISOString()),
    queryFn: () => api.calendar.getWeek(weekStart),
  });
