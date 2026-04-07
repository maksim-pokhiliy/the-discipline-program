import { z } from "zod";

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
