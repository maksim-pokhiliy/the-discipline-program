import { type z } from "zod";

import {
  type activityItemSchema,
  type getDashboardDataResponseSchema,
} from "./dashboard-api.schema";

export type DashboardData = z.infer<typeof getDashboardDataResponseSchema>;
export type ContentStats = DashboardData["contentStats"];
export type UserStats = DashboardData["userStats"];
export type ActivityItem = z.infer<typeof activityItemSchema>;
