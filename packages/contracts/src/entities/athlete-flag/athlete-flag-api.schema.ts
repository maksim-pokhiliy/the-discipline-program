import { z } from "zod";

import {
  athleteFlagSchema,
  createAthleteFlagSchema,
  updateAthleteFlagSchema,
} from "./athlete-flag.schema";

export const getAthleteFlagsResponseSchema = z.array(athleteFlagSchema);

export const getAthleteFlagByIdParamsSchema = z.object({
  flagId: z.string().cuid(),
});

export const createAthleteFlagRequestSchema = createAthleteFlagSchema;
export const createAthleteFlagResponseSchema = athleteFlagSchema;

export const updateAthleteFlagParamsSchema = z.object({
  flagId: z.string().cuid(),
});
export const updateAthleteFlagRequestSchema = updateAthleteFlagSchema;
export const updateAthleteFlagResponseSchema = athleteFlagSchema;

export const deleteAthleteFlagParamsSchema = z.object({
  flagId: z.string().cuid(),
});

export const resolveAthleteFlagParamsSchema = z.object({
  flagId: z.string().cuid(),
});
export const resolveAthleteFlagResponseSchema = athleteFlagSchema;
