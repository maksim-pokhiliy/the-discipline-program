import { z } from "zod";

import { HealthStatus } from "../athlete-profile";
import { ActionItemSeverity, ActionItemType } from "../coach-action-item";

import { CoachActivityType, ProgressTrend, TodayStatus } from "./coach-dashboard.constants";

export const todayStatusSchema = z.nativeEnum(TodayStatus);

export const dashboardOverviewSchema = z.object({
  totalActiveAthletes: z.number().int(),
  activePlansCount: z.number().int(),
  workoutsPlannedToday: z.number().int(),
  workoutsCompletedToday: z.number().int(),
  workoutsPlannedThisWeek: z.number().int(),
  workoutsCompletedThisWeek: z.number().int(),
  openActionItemsCount: z.number().int(),
  newAthletesCount: z.number().int(),
});

export const dashboardActionItemSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(ActionItemType),
  severity: z.nativeEnum(ActionItemSeverity),
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  athleteImage: z.string().nullable(),
  message: z.string(),
  href: z.string(),
  createdAt: z.date(),
});

export const athleteDailySummarySchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  planId: z.string().cuid().nullable(),
  planName: z.string().nullable(),
  todayStatus: todayStatusSchema,
  missedCount: z.number().int(),
  todayWorkoutTitle: z.string().nullable(),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nullable(),
  healthStatus: z.nativeEnum(HealthStatus),
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
  trend: z.nativeEnum(ProgressTrend),
  href: z.string(),
});

export const progressBucketsSchema = z.object({
  improving: z.array(progressAthleteSchema),
  stagnating: z.array(progressAthleteSchema),
  declining: z.array(progressAthleteSchema),
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
  type: z.nativeEnum(CoachActivityType),
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

export const coachDashboardDataSchema = z.object({
  overview: dashboardOverviewSchema,
  actionItems: z.array(dashboardActionItemSchema),
  athletesSummary: z.array(athleteDailySummarySchema),
  loadDistributionToday: z.array(loadDistributionItemSchema),
  progressBuckets: progressBucketsSchema,
  recentNotes: z.array(dashboardNoteSchema),
  recentActivity: z.array(coachActivityItemSchema),
  onboarding: z.array(onboardingAthleteSchema),
});
