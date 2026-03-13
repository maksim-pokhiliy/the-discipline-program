import { type z } from "zod";

import {
  type createAthleteMaxRequestSchema,
  type createAthleteMaxResponseSchema,
  type deleteAthleteMaxParamsSchema,
  type getAthleteMaxByIdParamsSchema,
  type getAthleteMaxesForExercisesRequestSchema,
  type getAthleteMaxesForExercisesResponseSchema,
  type getAthleteMaxesParamsSchema,
  type getAthleteMaxesResponseSchema,
  type getAthleteMaxResponseSchema,
  type updateAthleteMaxParamsSchema,
  type updateAthleteMaxRequestSchema,
  type updateAthleteMaxResponseSchema,
} from "./athlete-max-api.schema";

export type GetAthleteMaxesParams = z.infer<typeof getAthleteMaxesParamsSchema>;
export type GetAthleteMaxesResponse = z.infer<typeof getAthleteMaxesResponseSchema>;
export type GetAthleteMaxByIdParams = z.infer<typeof getAthleteMaxByIdParamsSchema>;
export type GetAthleteMaxResponse = z.infer<typeof getAthleteMaxResponseSchema>;
export type CreateAthleteMaxRequest = z.infer<typeof createAthleteMaxRequestSchema>;
export type CreateAthleteMaxResponse = z.infer<typeof createAthleteMaxResponseSchema>;
export type UpdateAthleteMaxParams = z.infer<typeof updateAthleteMaxParamsSchema>;
export type UpdateAthleteMaxRequest = z.infer<typeof updateAthleteMaxRequestSchema>;
export type UpdateAthleteMaxResponse = z.infer<typeof updateAthleteMaxResponseSchema>;
export type DeleteAthleteMaxParams = z.infer<typeof deleteAthleteMaxParamsSchema>;
export type GetAthleteMaxesForExercisesRequest = z.infer<
  typeof getAthleteMaxesForExercisesRequestSchema
>;
export type GetAthleteMaxesForExercisesResponse = z.infer<
  typeof getAthleteMaxesForExercisesResponseSchema
>;
