import { z } from "zod";

import { PlanEnrollmentStatus } from "./plan-enrollment.constants";

export const planEnrollmentSchema = z.object({
  id: z.string().cuid(),
  trainingPlanId: z.string().cuid(),
  userId: z.string().cuid(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  status: z.nativeEnum(PlanEnrollmentStatus),
  createdAt: z.date(),
});

export const createPlanEnrollmentSchema = z.object({
  userId: z.string().cuid(),
  startDate: z.date().optional(),
  endDate: z.date().nullable().optional(),
});

export const updatePlanEnrollmentSchema = z.object({
  endDate: z.date().nullable().optional(),
  status: z.nativeEnum(PlanEnrollmentStatus).optional(),
});
