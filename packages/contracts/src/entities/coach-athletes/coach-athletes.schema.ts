import { z } from "zod";

import { HealthStatus } from "../athlete-profile";
import { ActionItemSeverity, ActionItemType } from "../coach-action-item";
import { ProcessStatus } from "../coach-dashboard/coach-dashboard.constants";
import { PlanEnrollmentStatus } from "../plan-enrollment";

export const coachAthletePlanSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
});

export const coachAthleteListItemSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  healthStatus: z.nativeEnum(HealthStatus),
  activePlans: z.array(coachAthletePlanSchema),
  processStatus: z.nativeEnum(ProcessStatus),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nullable(),
  openActionItemsCount: z.number().int(),
  needsAttention: z.boolean(),
  enrolledSince: z.date(),
});

export const coachAthletesSummarySchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  needsAttention: z.number().int(),
  injured: z.number().int(),
  restricted: z.number().int(),
});

export const coachAthletesDataSchema = z.object({
  summary: coachAthletesSummarySchema,
  athletes: z.array(coachAthleteListItemSchema),
});

export const planDisciplineSchema = z.object({
  planId: z.string().cuid(),
  planName: z.string(),
  enrollmentStatus: z.nativeEnum(PlanEnrollmentStatus),
  enrolledDate: z.date(),
  completed: z.number().int(),
  available: z.number().int(),
  planned: z.number().int(),
});

export const recentWorkoutSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  date: z.date(),
  planName: z.string(),
});

export const athleteActionItemSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(ActionItemType),
  severity: z.nativeEnum(ActionItemSeverity),
  message: z.string(),
  createdAt: z.date(),
});

export const nextWorkoutSchema = z.object({
  title: z.string(),
  date: z.date(),
  planName: z.string(),
});

export const consistencySchema = z.object({
  adherenceRate4w: z.number(),
  currentStreak: z.number().int(),
  missedThisWeek: z.number().int(),
});

export const coachAthleteDetailSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: z.string().nullable(),
  healthStatus: z.nativeEnum(HealthStatus),
  processStatus: z.nativeEnum(ProcessStatus),
  planDiscipline: z.array(planDisciplineSchema),
  recentWorkouts: z.array(recentWorkoutSchema),
  actionItems: z.array(athleteActionItemSchema),
  nextWorkout: nextWorkoutSchema.nullable(),
  consistency: consistencySchema,
  enrolledSince: z.date(),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nullable(),
});
