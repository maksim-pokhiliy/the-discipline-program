import { z } from "zod";

import { EnrollmentStatus } from "./plan-enrollment.constants";

export const enrollmentStatusSchema = z.nativeEnum(EnrollmentStatus);

export const planEnrollmentSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  athleteId: z.string().cuid(),
  enrolledById: z.string().cuid(),
  boardedAt: z.coerce.date(),
  status: enrollmentStatusSchema,
  statusChangedAt: z.date(),
  hidePastBeforeBoarding: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanEnrollmentSchema = z.object({
  planId: z.string().cuid(),
  athleteId: z.string().cuid(),
  boardedAt: z.coerce.date(),
  hidePastBeforeBoarding: z.boolean().optional().default(false),
});
