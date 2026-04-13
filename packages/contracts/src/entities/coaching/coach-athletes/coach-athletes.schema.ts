import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { HealthStatus } from "../athlete-profile";
import { ProcessStatus } from "../coach-dashboard";

export const coachAthletePlanSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
});

export const coachAthleteListItemSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string(),
  image: imageUrlSchema,
  healthStatus: z.nativeEnum(HealthStatus),
  activePlans: z.array(coachAthletePlanSchema),
  processStatus: z.nativeEnum(ProcessStatus),
  lastActivityDate: z.date().nullable(),
  daysSinceLastActivity: z.number().int().nonnegative().nullable(),
  openActionItemsCount: z.number().int().nonnegative(),
  needsAttention: z.boolean(),
  enrolledSince: z.date(),
});

export const coachAthletesSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  needsAttention: z.number().int().nonnegative(),
  injured: z.number().int().nonnegative(),
  restricted: z.number().int().nonnegative(),
});
