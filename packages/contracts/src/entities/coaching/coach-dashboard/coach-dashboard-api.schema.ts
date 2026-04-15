import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { HealthStatus } from "../athlete-profile";
import { ActionItemSeverity, ActionItemType } from "../coach-action-item";

import { ProcessStatus, TodayStatus } from "./coach-dashboard.constants";

export const todayStatusSchema = z.nativeEnum(TodayStatus);

export const dashboardOverviewSchema = z.object({
  totalActiveAthletes: z.number().int().nonnegative(),
  activePlansCount: z.number().int().nonnegative(),
  workoutsPlannedToday: z.number().int().nonnegative(),
  workoutsCompletedToday: z.number().int().nonnegative(),
  workoutsPlannedThisWeek: z.number().int().nonnegative(),
  workoutsCompletedThisWeek: z.number().int().nonnegative(),
  openActionItemsCount: z.number().int().nonnegative(),
  newAthletesCount: z.number().int().nonnegative(),
});

export const dashboardActionItemSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(ActionItemType),
  severity: z.nativeEnum(ActionItemSeverity),
  athleteId: z.string().cuid(),
  athleteName: z.string().nullable(),
  athleteImage: imageUrlSchema,
  message: z.string(),
  createdAt: z.date(),
});

export const athleteDailySummarySchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: imageUrlSchema,
  planId: z.string().cuid().nullable(),
  planName: z.string().nullable(),
  todayStatus: todayStatusSchema,
  missedCount: z.number().int().nonnegative(),
  todayWorkoutTitle: z.string().nullable(),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nonnegative().nullable(),
  healthStatus: z.nativeEnum(HealthStatus),
});

export const progressAthleteSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  image: imageUrlSchema,
  processStatus: z.nativeEnum(ProcessStatus),
});

export const progressBucketsSchema = z.object({
  onTrack: z.array(progressAthleteSchema),
  steady: z.array(progressAthleteSchema),
  fallingBehind: z.array(progressAthleteSchema),
  avgEngagementRate: z.number().finite().min(0).max(1),
});

export const coachDashboardDataSchema = z.object({
  overview: dashboardOverviewSchema,
  actionItems: z.array(dashboardActionItemSchema),
  athletesSummary: z.array(athleteDailySummarySchema),
  progressBuckets: progressBucketsSchema,
});
