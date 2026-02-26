import { type z } from "zod";

import {
  type coachActivityItemSchema,
  type athleteDailySummarySchema,
  type coachDashboardDataSchema,
  type dashboardActionItemSchema,
  type dashboardNoteSchema,
  type dashboardOverviewSchema,
  type endingPlanSchema,
  type loadDistributionItemSchema,
  type onboardingAthleteSchema,
  type progressAthleteSchema,
  type progressBucketsSchema,
  type todayStatusSchema,
} from "./coach-dashboard.schema";

export type TodayStatus = z.infer<typeof todayStatusSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type DashboardActionItem = z.infer<typeof dashboardActionItemSchema>;
export type AthleteDailySummary = z.infer<typeof athleteDailySummarySchema>;
export type LoadDistributionItem = z.infer<typeof loadDistributionItemSchema>;
export type ProgressAthlete = z.infer<typeof progressAthleteSchema>;
export type ProgressBuckets = z.infer<typeof progressBucketsSchema>;
export type DashboardNote = z.infer<typeof dashboardNoteSchema>;
export type CoachActivityItem = z.infer<typeof coachActivityItemSchema>;
export type OnboardingAthlete = z.infer<typeof onboardingAthleteSchema>;
export type EndingPlan = z.infer<typeof endingPlanSchema>;
export type CoachDashboardData = z.infer<typeof coachDashboardDataSchema>;
