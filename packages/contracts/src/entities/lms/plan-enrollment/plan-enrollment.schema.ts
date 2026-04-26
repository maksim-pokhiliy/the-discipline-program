import { z } from "zod";

import { PlanEnrollmentStatus } from "./plan-enrollment.constants";

export const planEnrollmentSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  userId: z.string().cuid(),
  startedAtWeekIndex: z.number().int().nonnegative(),
  startedOnDate: z.date(),
  status: z.nativeEnum(PlanEnrollmentStatus),
  endedOnDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanEnrollmentSchema = z.object({
  userId: z.string().cuid(),
  startedAtWeekIndex: z.number().int().nonnegative().optional(),
  startedOnDate: z.date().optional(),
});

export const updatePlanEnrollmentSchema = z.object({
  endedOnDate: z.date().nullable().optional(),
  status: z.nativeEnum(PlanEnrollmentStatus).optional(),
});
