import { type z } from "zod";

import {
  type coachActivityItemSchema,
  type athleteDailySummarySchema,
  type athleteFlagSummarySchema,
  type attentionAlertSchema,
  type coachDashboardDataSchema,
  type dashboardNoteSchema,
  type dashboardOverviewSchema,
  type endingPlanSchema,
  type loadDistributionItemSchema,
  type onboardingAthleteSchema,
  type progressAthleteSchema,
  type progressBucketsSchema,
} from "./coach-dashboard.schema";

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type AthleteFlagSummary = z.infer<typeof athleteFlagSummarySchema>;
export type AttentionAlert = z.infer<typeof attentionAlertSchema>;
export type AthleteDailySummary = z.infer<typeof athleteDailySummarySchema>;
export type LoadDistributionItem = z.infer<typeof loadDistributionItemSchema>;
export type ProgressAthlete = z.infer<typeof progressAthleteSchema>;
export type ProgressBuckets = z.infer<typeof progressBucketsSchema>;
export type DashboardNote = z.infer<typeof dashboardNoteSchema>;
export type CoachActivityItem = z.infer<typeof coachActivityItemSchema>;
export type OnboardingAthlete = z.infer<typeof onboardingAthleteSchema>;
export type EndingPlan = z.infer<typeof endingPlanSchema>;
export type CoachDashboardData = z.infer<typeof coachDashboardDataSchema>;
