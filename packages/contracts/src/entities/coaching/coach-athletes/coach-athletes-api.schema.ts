import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { Gender, HealthStatus } from "../athlete-profile";
import { ActionItemSeverity, ActionItemType } from "../coach-action-item";
import { ProcessStatus, TodayStatus, todayStatusSchema } from "../coach-dashboard";

import {
  coachAthleteEnrollmentSchema,
  coachAthleteListItemSchema,
  coachAthletesSummarySchema,
} from "./coach-athletes.schema";

export const coachAthleteDetailParamsSchema = z.object({
  userId: z.string().cuid(),
});

export const coachAthletesDataSchema = z.object({
  summary: coachAthletesSummarySchema,
  athletes: z.array(coachAthleteListItemSchema),
});

export const planDisciplineSchema = z.object({
  planId: z.string().cuid(),
  planName: z.string(),
  enrolledDate: z.date(),
  completed: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
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

export const last7DaySchema = z.object({
  date: z.date(),
  status: z.nativeEnum(TodayStatus),
});

export const consistencySchema = z.object({
  adherenceRate4w: z.number().finite().min(0).max(1),
  currentStreak: z.number().int().nonnegative(),
  missedThisWeek: z.number().int().nonnegative(),
});

export const coachAthleteNoteSchema = z.object({
  id: z.string().cuid(),
  content: z.string(),
  createdAt: z.date(),
});

export const coachAthleteDetailSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: imageUrlSchema,
  healthStatus: z.nativeEnum(HealthStatus),
  healthNote: z.string().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  heightCm: z.number().int().positive().nullable(),
  weightKg: z.number().finite().positive().nullable(),
  processStatus: z.nativeEnum(ProcessStatus),
  enrollments: z.array(coachAthleteEnrollmentSchema),
  planDiscipline: z.array(planDisciplineSchema),
  recentWorkouts: z.array(recentWorkoutSchema),
  actionItems: z.array(athleteActionItemSchema),
  notes: z.array(coachAthleteNoteSchema),
  nextWorkout: nextWorkoutSchema.nullable(),
  consistency: consistencySchema,
  enrolledSince: z.date(),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nonnegative().nullable(),
  last7Days: z.array(last7DaySchema),
  currentWeek: z.number().int().positive().nullable(),
  totalWeeks: z.number().int().nonnegative(),
  todayStatus: todayStatusSchema,
  todayWorkoutTitle: z.string().nullable(),
});
