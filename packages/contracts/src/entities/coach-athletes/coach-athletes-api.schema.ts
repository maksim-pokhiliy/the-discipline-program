import { z } from "zod";

import { HealthStatus } from "../athlete-profile";
import { ActionItemSeverity, ActionItemType } from "../coach-action-item";
import { ProcessStatus } from "../coach-dashboard";
import { PlanEnrollmentStatus } from "../plan-enrollment";

import { coachAthleteListItemSchema, coachAthletesSummarySchema } from "./coach-athletes.schema";

export const coachAthleteDetailParamsSchema = z.object({
  userId: z.string(),
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
