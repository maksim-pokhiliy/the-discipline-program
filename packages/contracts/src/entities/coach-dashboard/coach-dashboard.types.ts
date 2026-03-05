import { type z } from "zod";

import {
  type athleteDailySummarySchema,
  type coachDashboardDataSchema,
  type dashboardActionItemSchema,
  type dashboardNoteSchema,
  type dashboardOverviewSchema,
  type loadDistributionItemSchema,
  type onboardingAthleteSchema,
  type progressAthleteSchema,
  type progressBucketsSchema,
} from "./coach-dashboard.schema";

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type DashboardActionItem = z.infer<typeof dashboardActionItemSchema>;
export type AthleteDailySummary = z.infer<typeof athleteDailySummarySchema>;
export type LoadDistributionItem = z.infer<typeof loadDistributionItemSchema>;
export type ProgressAthlete = z.infer<typeof progressAthleteSchema>;
export type ProgressBuckets = z.infer<typeof progressBucketsSchema>;
export type DashboardNote = z.infer<typeof dashboardNoteSchema>;
export type OnboardingAthlete = z.infer<typeof onboardingAthleteSchema>;
export type CoachDashboardData = z.infer<typeof coachDashboardDataSchema>;
