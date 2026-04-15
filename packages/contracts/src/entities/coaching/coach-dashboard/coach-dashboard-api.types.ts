import { type z } from "zod";

import {
  type athleteDailySummarySchema,
  type coachDashboardDataSchema,
  type dashboardActionItemSchema,
  type dashboardOverviewSchema,
  type progressAthleteSchema,
  type progressBucketsSchema,
} from "./coach-dashboard-api.schema";

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type DashboardActionItem = z.infer<typeof dashboardActionItemSchema>;
export type AthleteDailySummary = z.infer<typeof athleteDailySummarySchema>;
export type ProgressAthlete = z.infer<typeof progressAthleteSchema>;
export type ProgressBuckets = z.infer<typeof progressBucketsSchema>;
export type CoachDashboardData = z.infer<typeof coachDashboardDataSchema>;
