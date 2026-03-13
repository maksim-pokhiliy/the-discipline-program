import { z } from "zod";

import {
  athleteMaxSchema,
  createAthleteMaxSchema,
  updateAthleteMaxSchema,
} from "./athlete-max.schema";

export const getAthleteMaxesParamsSchema = z.object({
  exerciseId: z.string().cuid().optional(),
});

export const getAthleteMaxesResponseSchema = z.array(athleteMaxSchema);

export const getAthleteMaxByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getAthleteMaxResponseSchema = athleteMaxSchema;

export const createAthleteMaxRequestSchema = createAthleteMaxSchema;

export const createAthleteMaxResponseSchema = athleteMaxSchema;

export const updateAthleteMaxParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateAthleteMaxRequestSchema = updateAthleteMaxSchema;

export const updateAthleteMaxResponseSchema = athleteMaxSchema;

export const deleteAthleteMaxParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getAthleteMaxesForExercisesRequestSchema = z.object({
  planId: z.string().cuid(),
  exerciseIds: z.array(z.string().cuid()).min(1),
});

export const getAthleteMaxesForExercisesResponseSchema = z.array(athleteMaxSchema);
