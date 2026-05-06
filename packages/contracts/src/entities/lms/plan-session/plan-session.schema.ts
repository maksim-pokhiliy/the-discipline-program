import { z } from "zod";

import { noNulByteString } from "../_domain/safe-string.schema";

import { PLAN_SESSION_CONSTANTS } from "./plan-session.constants";

const sessionLabelSchema = noNulByteString(PLAN_SESSION_CONSTANTS.MAX_LABEL_LENGTH);

export const planSessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: sessionLabelSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanSessionSchema = z.object({
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: sessionLabelSchema.optional(),
});

export const updatePlanSessionSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  label: sessionLabelSchema.nullable().optional(),
});
