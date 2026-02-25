import { z } from "zod";

import { flagTypeSchema } from "../athlete-flag";

import {
  ACTIVITY_TYPES,
  ALERT_SEVERITIES,
  ATTENTION_ALERT_TYPES,
  PROGRESS_TRENDS,
  TODAY_STATUSES,
} from "./coach-dashboard.constants";

export const dashboardOverviewSchema = z.object({
  totalActiveAthletes: z.number().int(),
  workoutsPlannedToday: z.number().int(),
  workoutsCompletedToday: z.number().int(),
  openFlagsCount: z.number().int(),
  endingPlansCount: z.number().int(),
});

export const athleteFlagSummarySchema = z.object({
  id: z.string().cuid(),
  type: flagTypeSchema,
  note: z.string().nullable(),
  createdAt: z.date(),
});

export const attentionAlertSchema = z.object({
  type: z.enum(ATTENTION_ALERT_TYPES),
  severity: z.enum(ALERT_SEVERITIES),
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  message: z.string(),
  href: z.string(),
});

export const athleteDailySummarySchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  planId: z.string().cuid().nullable(),
  planName: z.string().nullable(),
  todayStatus: z.enum(TODAY_STATUSES),
  todayWorkoutTitle: z.string().nullable(),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nullable(),
  activeFlags: z.array(athleteFlagSummarySchema),
});

export const loadDistributionItemSchema = z.object({
  categoryId: z.string().cuid(),
  categoryName: z.string(),
  athleteCount: z.number().int(),
  percentage: z.number(),
});

export const progressAthleteSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  completionRate: z.number(),
  trend: z.enum(PROGRESS_TRENDS),
  href: z.string(),
});

export const progressBucketsSchema = z.object({
  improving: z.array(progressAthleteSchema),
  stagnating: z.array(progressAthleteSchema),
  declining: z.array(progressAthleteSchema),
  avgCompletionRate: z.number(),
  avgEngagementRate: z.number(),
});

export const dashboardNoteSchema = z.object({
  id: z.string().cuid(),
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  content: z.string(),
  createdAt: z.date(),
});

export const coachActivityItemSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  description: z.string(),
  timestamp: z.date(),
});

export const onboardingAthleteSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  enrolledAt: z.date(),
  hasAnyLog: z.boolean(),
  hasCompletedFirst: z.boolean(),
  planName: z.string().nullable(),
});

export const endingPlanSchema = z.object({
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  planId: z.string().cuid(),
  planName: z.string(),
  endDate: z.date(),
  daysLeft: z.number().int(),
});

export const coachDashboardDataSchema = z.object({
  overview: dashboardOverviewSchema,
  attentionAlerts: z.array(attentionAlertSchema),
  athletesSummary: z.array(athleteDailySummarySchema),
  loadDistributionToday: z.array(loadDistributionItemSchema),
  progressBuckets: progressBucketsSchema,
  recentNotes: z.array(dashboardNoteSchema),
  recentActivity: z.array(coachActivityItemSchema),
  onboarding: z.array(onboardingAthleteSchema),
  endingPlans: z.array(endingPlanSchema),
});
