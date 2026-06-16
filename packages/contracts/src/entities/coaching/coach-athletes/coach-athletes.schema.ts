import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { EnrollmentStatus } from "../../lms/plan-enrollment";
import { Gender, HealthStatus } from "../athlete-profile";
import { ProcessStatus } from "../coach-dashboard";

export const coachAthleteEnrollmentSchema = z.object({
  planId: z.string().cuid(),
  planName: z.string(),
  status: z.nativeEnum(EnrollmentStatus),
  boardedAt: z.date(),
});

export const coachAthleteListItemSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: imageUrlSchema,
  healthStatus: z.nativeEnum(HealthStatus),
  healthNote: z.string().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  heightCm: z.number().int().positive().nullable(),
  weightKg: z.number().finite().positive().nullable(),
  enrollments: z.array(coachAthleteEnrollmentSchema),
  processStatus: z.nativeEnum(ProcessStatus),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nonnegative().nullable(),
  openActionItemsCount: z.number().int().nonnegative(),
  needsAttention: z.boolean(),
  isPending: z.boolean(),
  enrolledSince: z.date(),
});

export const coachAthletesSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  needsAttention: z.number().int().nonnegative(),
  injured: z.number().int().nonnegative(),
  restricted: z.number().int().nonnegative(),
});
